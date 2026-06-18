import { Router } from 'express';
import multer from 'multer';

import { createSos, getUserSosHistory } from '../controllers/sosController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { sosSchema } from '../middleware/validate.js';

const audioFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('audio/')) return cb(null, true);
  cb(new Error('Only audio files are allowed'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: audioFilter,
});

const router = Router();

router.post('/sos', authMiddleware, upload.single('audioFile'), validate(sosSchema), createSos);
router.get('/sos/history', authMiddleware, getUserSosHistory);

export default router;
