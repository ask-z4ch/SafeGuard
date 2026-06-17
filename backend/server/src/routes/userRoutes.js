import { Router } from 'express';
import multer from 'multer';

import { getProfile, uploadIdDocument } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.post('/upload-id', authMiddleware, upload.single('document'), uploadIdDocument);

export default router;
