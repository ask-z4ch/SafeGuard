import { Router } from 'express';

import {
  checkHash,
  issueVerifiableCredential,
  listSosRecords,
  listUsers,
  revokeVerifiableCredential,
  streamEncryptedIdDocument,
  streamSosAudio,
  verifyUser,
  getAuditLogs,
  deleteUserDocument,
} from '../controllers/adminController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { verifyUserSchema, issueVcSchema } from '../middleware/validate.js';

const router = Router();
const requireAdmin = [authMiddleware, adminMiddleware];

router.get('/sos', ...requireAdmin, listSosRecords);
router.get('/users', ...requireAdmin, listUsers);
router.post('/verify-user', ...requireAdmin, validate(verifyUserSchema), verifyUser);
router.post('/issue-vc/:userId', ...requireAdmin, validate(issueVcSchema), issueVerifiableCredential);
router.get('/check-hash/:hash', ...requireAdmin, checkHash);
router.get('/id-documents/:userId/:documentId', ...requireAdmin, streamEncryptedIdDocument);
router.get('/sos/:sosId/audio', ...requireAdmin, streamSosAudio);
router.get('/audit-logs', ...requireAdmin, getAuditLogs);
router.post('/revoke-vc/:vcRecordId', ...requireAdmin, revokeVerifiableCredential);
router.delete('/users/:userId/documents/:documentId', ...requireAdmin, deleteUserDocument);

export default router;
