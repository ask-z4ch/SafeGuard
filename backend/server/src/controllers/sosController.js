import User from '../models/User.js';
import VCRecord from '../models/VCRecord.js';
import SOSRecord from '../models/SOSRecord.js';
import { saveAudioFile } from '../services/fileService.js';
import { getIO } from '../services/socketService.js';

const serializeVc = (vc) =>
  vc
    ? {
        id: vc._id?.toString?.(),
        hash: vc.hash,
        transactionHash: vc.transactionHash,
        issuerDid: vc.issuerDid,
        createdAt: vc.createdAt,
        verifiableCredential: vc.verifiableCredential
      }
    : null;

export const createSos = async (req, res, next) => {
  try {
    const { messageType = 'default', messageText = '', lat, lng } = req.body;

    if (!['default', 'custom'].includes(messageType)) {
      return res.status(400).json({ message: 'messageType must be default or custom' });
    }

    if (!messageText.trim() && !req.file) {
      return res.status(400).json({ message: 'Provide messageText or an audio file' });
    }

    const user = await User.findById(req.user.id).select('name email verified idDocuments');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let audioDescriptor;
    if (req.file) {
      const stored = await saveAudioFile({
        buffer: req.file.buffer,
        originalName: req.file.originalname
      });
      audioDescriptor = {
        fileName: stored.fileName,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: stored.size
      };
    }

    const location = lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined;

    const record = await SOSRecord.create({
      user: user.id,
      messageType,
      messageText,
      audio: audioDescriptor,
      location
    });

    const host = process.env.APP_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const idDocumentUrls = (user.idDocuments || []).map((doc) => `${host}/api/admin/id-documents/${user.id}/${doc.id}`);
    const audioUrl = audioDescriptor ? `${host}/api/admin/sos/${record.id}/audio` : null;
    const latestVc = await VCRecord.findOne({ user: user.id }).sort({ createdAt: -1 }).lean();
    const serializedVc = serializeVc(latestVc);

    try {
      const io = getIO();
      io.to('admins').emit('sos', {
        id: record.id,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          verified: user.verified,
          idDocumentUrls
        },
        messageType,
        messageText,
        audioUrl,
        audio: audioDescriptor,
        location,
        createdAt: record.createdAt,
        latestCredential: serializedVc
      });
    } catch (socketError) {
      console.warn('Socket broadcast skipped:', socketError.message);
    }

    res.status(201).json({
      message: 'SOS dispatched',
      sosId: record.id,
      audioUrl,
      location,
      createdAt: record.createdAt,
      latestCredential: serializedVc
    });
  } catch (error) {
    next(error);
  }
};
