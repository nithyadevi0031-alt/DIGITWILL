import mongoose from 'mongoose';

const EmailVerificationTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  token: { type: String, required: true, unique: true }, // Hashed SHA256 token
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['ACTIVE', 'VERIFIED', 'EXPIRED'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date }
});

export const EmailVerificationToken = mongoose.model('EmailVerificationToken', EmailVerificationTokenSchema);
