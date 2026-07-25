import mongoose from 'mongoose';

// In-memory database fallback store if MongoDB server is offline
class MemoryStore {
  constructor() {
    this.beneficiaries = [];
    this.users = [];
    this.auditLogs = [];
    this.notifications = [];
    this.wills = [];
    this.assets = [];
    this.documents = [];
  }
}

export const memoryStore = new MemoryStore();
export let isMongoConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/digital_will_ai';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
    });
    isMongoConnected = true;
    console.log('✅ MongoDB connected successfully to', uri);
  } catch (error) {
    isMongoConnected = false;
    console.warn('⚠️ Local MongoDB connection failed or offline:', error.message);
    console.log('ℹ️ Digital Will AI server running with high-performance In-Memory state fallback.');
  }
};
