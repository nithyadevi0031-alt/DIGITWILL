import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/digital-will-ai';

  await mongoose.connect(uri);
}
