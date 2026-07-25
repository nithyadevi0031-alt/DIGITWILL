import mongoose from 'mongoose';

const OTPVerificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String, required: true, lowercase: true, trim: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  status: { type: String, enum: ['ACTIVE', 'VERIFIED', 'EXPIRED', 'BLOCKED'], default: 'ACTIVE' },
  createdAt: { type: Date, default: Date.now }
});

// Auto-index for expiry cleanup
OTPVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OTPVerificationSchema.index({ email: 1, status: 1 });

export const OTPVerification = mongoose.model('OTPVerification', OTPVerificationSchema);
