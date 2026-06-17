import User from '../models/User.js';
import VCRecord from '../models/VCRecord.js';
import { saveEncryptedFile } from '../services/fileService.js';

const allowedIdTypes = ['aadhar', 'passport'];

export const uploadIdDocument = async (req, res, next) => {
  try {
    const { idType } = req.body;

    if (!allowedIdTypes.includes(idType)) {
      return res.status(400).json({ message: 'idType must be either aadhar or passport' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'ID document file is required' });
    }

    const metadata = await saveEncryptedFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const document = {
      idType,
      fileName: metadata.fileName,
      originalName: metadata.originalName,
      mimeType: metadata.mimeType,
      size: metadata.size,
      iv: metadata.iv,
      authTag: metadata.authTag
    };

    user.idDocuments.push(document);
    await user.save();

    const savedDocument = user.idDocuments[user.idDocuments.length - 1];

    res.status(201).json({
      message: 'ID document uploaded successfully',
      documentId: savedDocument.id
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('name email verified idDocuments role createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const credentials = await VCRecord.find({ user: user.id })
      .sort({ createdAt: -1 })
      .select('hash transactionHash issuerDid verifiableCredential createdAt')
      .lean();

    const host = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;

    const documents = (user.idDocuments || []).map((doc) => ({
      id: doc.id,
      idType: doc.idType,
      originalName: doc.originalName,
      uploadedAt: doc.uploadedAt,
      status: user.verified ? 'verified' : 'pending',
      url: `${host}/api/admin/id-documents/${user.id}/${doc.id}`
    }));

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        role: user.role,
        createdAt: user.createdAt
      },
      documents,
      credentials: credentials.map((vc) => ({
        id: vc._id ? vc._id.toString() : undefined,
        hash: vc.hash,
        transactionHash: vc.transactionHash,
        issuerDid: vc.issuerDid,
        createdAt: vc.createdAt,
        verifiableCredential: vc.verifiableCredential
      }))
    });
  } catch (error) {
    next(error);
  }
};
