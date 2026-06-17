import { Router } from 'express';

import {
  checkHash,
  issueVerifiableCredential,
  listSosRecords,
  streamEncryptedIdDocument,
  streamSosAudio,
  verifyUser
} from '../controllers/adminController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

const requireAdmin = [authMiddleware, adminMiddleware];

router.get('/sos', ...requireAdmin, listSosRecords);
router.post('/verify-user', ...requireAdmin, verifyUser);
router.post('/issue-vc/:userId', ...requireAdmin, issueVerifiableCredential);
router.get('/check-hash/:hash', ...requireAdmin, checkHash);
router.get('/id-documents/:userId/:documentId', ...requireAdmin, streamEncryptedIdDocument);
router.get('/sos/:sosId/audio', ...requireAdmin, streamSosAudio);

export default router;
