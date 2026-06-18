import { Router } from 'express';
import multer from 'multer';

import { getProfile, uploadIdDocument, updateProfile } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { idUploadSchema, updateProfileSchema } from '../middleware/validate.js';

const docFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new Error('Only JPEG, PNG, WebP images and PDF files are allowed'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: docFilter,
});

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.post('/upload-id', authMiddleware, validate(idUploadSchema), upload.single('document'), uploadIdDocument);
router.put('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);

export default router;
