import { Router } from 'express';
import multer from 'multer';

import { createSos } from '../controllers/sosController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = Router();

router.post('/sos', authMiddleware, upload.single('audioFile'), createSos);

export default router;
