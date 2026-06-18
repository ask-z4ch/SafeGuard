import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const sosSchema = z.object({
  messageType: z.enum(['default', 'custom']).default('default'),
  messageText: z.string().max(500).default(''),
  lat: z.string().optional(),
  lng: z.string().optional(),
});

export const idUploadSchema = z.object({
  idType: z.enum(['aadhar', 'passport']),
});

export const verifyUserSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

export const issueVcSchema = z.object({
  tripId: z.string().max(100).optional(),
  visitPeriod: z.string().max(50).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.flatten().fieldErrors;
    const first = Object.values(messages).flat()[0];
    return res.status(400).json({ message: first || 'Validation failed', errors: messages });
  }
  req.validated = result.data;
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({ message: 'Invalid query parameters', errors: result.error.flatten().fieldErrors });
  }
  req.validated = result.data;
  next();
};
