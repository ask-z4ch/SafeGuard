import http from 'http';
import dotenv from 'dotenv';

import app from './app.js';
import connectDB from './config/db.js';
import { initSocket } from './services/socketService.js';
import seedAdmin, { seedDemoUser } from './utils/seedAdmin.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
initSocket(server);

const start = async () => {
  try {
    await connectDB();
    await seedAdmin();
    await seedDemoUser();
    server.listen(PORT, () => {
      console.log(`API server ready on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed', error);
    process.exit(1);
  }
};

start();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
