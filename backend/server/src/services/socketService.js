import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const defaultOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://safeguard-plum.vercel.app',
  'https://safeguardadmin.vercel.app',
  'capacitor://localhost',
  'http://localhost',
];

const ioOrigins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

let ioInstance;

export const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: ioOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    }
  });

  ioInstance.on('connection', (socket) => {
    let token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (typeof token === 'string' && token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    if (!token) {
      socket.emit('error', 'Authentication token required');
      socket.disconnect();
      return;
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = payload;

      if (payload.role === 'admin') {
        socket.join('admins');
      }
    } catch (error) {
      socket.emit('error', 'Invalid token');
      socket.disconnect();
    }
  });

  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized');
  }

  return ioInstance;
};
