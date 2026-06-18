import crypto from 'crypto';
import path from 'path';
import { createReadStream, unlink } from 'fs';

import User from '../models/User.js';
import VCRecord from '../models/VCRecord.js';
import SOSRecord from '../models/SOSRecord.js';
import AuditLog from '../models/AuditLog.js';
import { issueTouristCredential } from '../services/veramoService.js';
import { anchorCredentialHash, checkCredentialHash, revokeCredentialHash } from '../services/blockchainService.js';
import { readAndDecryptFile, getUploadsRoot } from '../services/fileService.js';

const buildHost = (req) => process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

const logAdminAction = async ({ adminId, action, targetUser, targetType, details, ip }) => {
  try {
    await AuditLog.create({ admin: adminId, action, targetUser, targetType, details, ip });
  } catch (err) {
    console.warn('Failed to write audit log:', err.message);
  }
};

export const issueVerifiableCredential = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { tripId = 'DEMO-TRIP-001', visitPeriod = '2024-01-01/2024-12-31' } = req.validated || req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.verified) {
      return res.status(400).json({ message: 'User must be verified before receiving credentials' });
    }

    const { verifiableCredential, issuerDid } = await issueTouristCredential({ user, tripId, visitPeriod });

    const serialized = JSON.stringify(verifiableCredential);
    const hash = crypto.createHash('sha256').update(serialized).digest('hex');

    const anchor = await anchorCredentialHash(hash);

    const record = await VCRecord.create({
      user: user.id,
      hash,
      transactionHash: anchor.transactionHash,
      issuerDid,
      verifiableCredential,
    });

    await logAdminAction({
      adminId: req.user.id,
      action: 'issue_vc',
      targetUser: userId,
      targetType: 'vc',
      details: { hash, transactionHash: anchor.transactionHash },
      ip: req.ip,
    });

    res.status(201).json({
      message: 'Verifiable credential issued',
      vcRecordId: record.id,
      hash,
      anchor,
      verifiableCredential,
    });
  } catch (error) {
    next(error);
  }
};

export const revokeVerifiableCredential = async (req, res, next) => {
  try {
    const { vcRecordId } = req.params;
    const record = await VCRecord.findById(vcRecordId);
    if (!record) {
      return res.status(404).json({ message: 'VC record not found' });
    }

    if (record.revoked) {
      return res.status(400).json({ message: 'Credential already revoked' });
    }

    const result = await revokeCredentialHash(record.hash);

    record.revoked = true;
    record.revokedAt = new Date();
    record.revokeTransactionHash = result.transactionHash;
    await record.save();

    await AuditLog.create({
      admin: req.user.id,
      action: 'revoke_vc',
      targetUser: record.user,
      targetType: 'vc',
      details: { vcRecordId, hash: record.hash, transactionHash: result.transactionHash },
      ip: req.ip,
    });

    res.json({ message: 'Credential revoked', hash: record.hash, result });
  } catch (error) {
    next(error);
  }
};

export const listSosRecords = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      SOSRecord.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'name email verified idDocuments'),
      SOSRecord.countDocuments(),
    ]);

    const userIds = records.map((r) => r.user?._id).filter(Boolean).map((id) => id.toString());
    const latestVcByUser = new Map();
    if (userIds.length) {
      const vcRecords = await VCRecord.find({ user: { $in: userIds } }).sort({ createdAt: -1 }).lean();
      for (const entry of vcRecords) {
        const uid = entry.user?.toString?.();
        if (uid && !latestVcByUser.has(uid)) latestVcByUser.set(uid, entry);
      }
    }

    const host = buildHost(req);

    const items = records.map((record) => {
      const usr = record.user;
      const usrId = usr?._id?.toString();
      const idDocumentUrls = usr ? (usr.idDocuments || []).map((doc) => `${host}/api/admin/id-documents/${usrId}/${doc.id}`) : [];
      const latestVc = usrId ? latestVcByUser.get(usrId) : null;

      return {
        id: record.id,
        messageType: record.messageType,
        messageText: record.messageText,
        audio: record.audio || null,
        audioUrl: record.audio?.fileName ? `${host}/api/admin/sos/${record.id}/audio` : null,
        location: record.location || null,
        createdAt: record.createdAt,
        user: usr ? { id: usrId, name: usr.name, email: usr.email, verified: usr.verified, idDocumentUrls } : null,
        latestCredential: latestVc
          ? { id: latestVc._id?.toString?.(), hash: latestVc.hash, transactionHash: latestVc.transactionHash, issuerDid: latestVc.issuerDid, createdAt: latestVc.createdAt, verifiableCredential: latestVc.verifiableCredential }
          : null,
      };
    });

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const filter = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }] }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
      User.countDocuments(filter),
    ]);

    const userIds = users.map((u) => u.id);

    const items = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      verified: u.verified,
      documentCount: (u.idDocuments || []).length,
      vcCount: 0,
      createdAt: u.createdAt,
    }));

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const verifyUser = async (req, res, next) => {
  try {
    const { userId } = req.validated;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    await logAdminAction({
      adminId: req.user.id,
      action: 'verify_user',
      targetUser: userId,
      targetType: 'user',
      details: {},
      ip: req.ip,
    });

    res.json({
      message: 'User marked as verified',
      user: { id: user.id, name: user.name, email: user.email, verified: user.verified },
    });
  } catch (error) {
    next(error);
  }
};

export const checkHash = async (req, res, next) => {
  try {
    const { hash } = req.params;
    if (!hash) {
      return res.status(400).json({ message: 'Hash parameter is required' });
    }

    const canonical = hash.startsWith('0x') ? hash.slice(2) : hash;
    if (canonical.length !== 64) {
      return res.status(400).json({ message: 'Hash must be 32-byte hex' });
    }

    let onChain;
    try {
      onChain = await checkCredentialHash(`0x${canonical}`);
    } catch (chainError) {
      onChain = { error: chainError.message };
    }

    const record = await VCRecord.findOne({ hash: canonical }).sort({ createdAt: -1 }).lean();

    res.json({
      hash: canonical,
      exists: Boolean(onChain?.exists || record),
      onChain,
      storedRecord: record
        ? {
            id: record._id?.toString?.(),
            user: record.user?.toString?.(),
            hash: record.hash,
            transactionHash: record.transactionHash,
            issuerDid: record.issuerDid,
            createdAt: record.createdAt,
            verifiableCredential: record.verifiableCredential,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
};

export const streamEncryptedIdDocument = async (req, res, next) => {
  try {
    const { userId, documentId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const document = user.idDocuments.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join(getUploadsRoot(), document.fileName);
    const decrypted = await readAndDecryptFile({
      filePath,
      ivHex: document.iv,
      authTagHex: document.authTag,
    });

    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    res.send(decrypted);
  } catch (error) {
    next(error);
  }
};

export const streamSosAudio = async (req, res, next) => {
  try {
    const { sosId } = req.params;
    const record = await SOSRecord.findById(sosId);

    if (!record || !record.audio?.fileName) {
      return res.status(404).json({ message: 'Audio not found' });
    }

    const audioPath = path.join(getUploadsRoot(), 'sos', record.audio.fileName);
    res.setHeader('Content-Type', record.audio.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${record.audio.originalName || record.audio.fileName}"`);

    const stream = createReadStream(audioPath);
    stream.on('error', (error) => next(error));
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const getAuditLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).populate('admin', 'name email').populate('targetUser', 'name email'),
      AuditLog.countDocuments(),
    ]);

    const items = logs.map((log) => ({
      id: log.id,
      action: log.action,
      admin: log.admin ? { id: log.admin.id, name: log.admin.name, email: log.admin.email } : null,
      targetUser: log.targetUser ? { id: log.targetUser.id, name: log.targetUser.name, email: log.targetUser.email } : null,
      targetType: log.targetType,
      details: log.details,
      createdAt: log.createdAt,
    }));

    res.json({ items, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};

export const deleteUserDocument = async (req, res, next) => {
  try {
    const { userId, documentId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const doc = user.idDocuments.id(documentId);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join(getUploadsRoot(), doc.fileName);
    user.idDocuments.pull(documentId);
    await user.save();

    unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') console.warn('Failed to delete file:', err.message);
    });

    await logAdminAction({
      adminId: req.user.id,
      action: 'delete_document',
      targetUser: userId,
      targetType: 'document',
      details: { documentId, fileName: doc.fileName, idType: doc.idType },
      ip: req.ip,
    });

    res.json({ message: 'Document deleted' });
  } catch (error) {
    next(error);
  }
};
