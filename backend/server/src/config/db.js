import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  // HACK: fallback to in-memory so the project runs without a real MongoDB — remove for production
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000
      });
      console.log('MongoDB connected (Atlas/local)');
      return;
    } catch (error) {
      console.warn(`MongoDB remote connection failed: ${error.message}. Falling back to in-memory server.`);
    }
  }

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log(`MongoDB connected (in-memory at ${uri})`);
};

export default connectDB;
