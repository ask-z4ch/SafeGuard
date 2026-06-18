import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import sosRoutes from './routes/sosRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet());

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'https://safeguard-plum.vercel.app', 'https://safeguardadmin.vercel.app', 'capacitor://localhost', 'http://localhost'];

const vercelPreviewRe = /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/;

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || corsOrigins.includes(origin) || vercelPreviewRe.test(origin) || origin.startsWith('http://localhost') || origin.startsWith('capacitor://localhost')) {
      return cb(null, true);
    }
    cb(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false });

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', apiLimiter, userRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api', apiLimiter, sosRoutes);
app.use('/api', apiLimiter, publicRoutes);

const trainingModulePath = join(__dirname, '..', 'public', 'training-module');
app.use('/training-module', express.static(trainingModulePath));

app.use(errorHandler);

export default app;
