import crypto from 'crypto';
import path from 'path';
import { createReadStream } from 'fs';

import User from '../models/User.js';
import VCRecord from '../models/VCRecord.js';
import SOSRecord from '../models/SOSRecord.js';
import { issueTouristCredential } from '../services/veramoService.js';
import { anchorCredentialHash, checkCredentialHash } from '../services/blockchainService.js';
import { readAndDecryptFile, getUploadsRoot } from '../services/fileService.js';

const buildHost = (req) => process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

export const issueVerifiableCredential = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { tripId = 'DEMO-TRIP-001', visitPeriod = '2024-01-01/2024-12-31' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.verified) {
      return res.status(400).json({ message: 'User must verify email before receiving credentials' });
    }

    const { verifiableCredential, issuerDid } = await issueTouristCredential({
      user,
      tripId,
      visitPeriod
    });

    const serialized = JSON.stringify(verifiableCredential);
    const hash = crypto.createHash('sha256').update(serialized).digest('hex');

    const anchor = await anchorCredentialHash(hash);

    const record = await VCRecord.create({
      user: user.id,
      hash,
      transactionHash: anchor.transactionHash,
      issuerDid,
      verifiableCredential
    });

    res.status(201).json({
      message: 'Verifiable credential issued',
      vcRecordId: record.id,
      hash,
      anchor,
      verifiableCredential
    });
  } catch (error) {
    next(error);
  }
};

export const listSosRecords = async (req, res, next) => {
  try {
    const records = await SOSRecord.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email verified idDocuments');

    const userIds = records
      .map((record) => record.user?._id)
      .filter(Boolean)
      .map((id) => id.toString());

    const latestVcByUser = new Map();
    if (userIds.length) {
      const vcRecords = await VCRecord.find({ user: { $in: userIds } })
        .sort({ createdAt: -1 })
        .lean();

      for (const entry of vcRecords) {
        const userId = entry.user?.toString?.();
        if (userId && !latestVcByUser.has(userId)) {
          latestVcByUser.set(userId, entry);
        }
      }
    }

    const host = buildHost(req);

    const items = records.map((record) => {
      const user = record.user;
      const userId = user?._id?.toString();
      const idDocumentUrls = user
        ? (user.idDocuments || []).map((doc) => `${host}/api/admin/id-documents/${userId}/${doc.id}`)
        : [];
      const latestVc = userId ? latestVcByUser.get(userId) : null;

      return {
        id: record.id,
        messageType: record.messageType,
        messageText: record.messageText,
        audio: record.audio || null,
        audioUrl: record.audio?.fileName ? `${host}/api/admin/sos/${record.id}/audio` : null,
        location: record.location || null,
        createdAt: record.createdAt,
        user: user
          ? {
              id: userId,
              name: user.name,
              email: user.email,
              verified: user.verified,
              idDocumentUrls
            }
          : null,
        latestCredential: latestVc
          ? {
              id: latestVc._id?.toString?.(),
              hash: latestVc.hash,
              transactionHash: latestVc.transactionHash,
              issuerDid: latestVc.issuerDid,
              createdAt: latestVc.createdAt,
              verifiableCredential: latestVc.verifiableCredential
            }
          : null
      };
    });

    res.json({ items });
  } catch (error) {
    next(error);
  }
};

export const verifyUser = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({
      message: 'User marked as verified',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.verified
      }
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
            verifiableCredential: record.verifiableCredential
          }
        : null
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
      authTagHex: document.authTag
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
