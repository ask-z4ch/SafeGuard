import { Router } from 'express';
import multer from 'multer';

import { getProfile, uploadIdDocument, updateProfile } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { idUploadSchema, updateProfileSchema } from '../middleware/validate.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.get('/profile', authMiddleware, getProfile);
router.post('/upload-id', authMiddleware, validate(idUploadSchema), upload.single('document'), uploadIdDocument);
router.put('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);

export default router;
