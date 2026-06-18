import { Router } from 'express';
import multer from 'multer';

import { createSos, getUserSosHistory } from '../controllers/sosController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { sosSchema } from '../middleware/validate.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router();

router.post('/sos', authMiddleware, validate(sosSchema), upload.single('audioFile'), createSos);
router.get('/sos/history', authMiddleware, getUserSosHistory);

export default router;
