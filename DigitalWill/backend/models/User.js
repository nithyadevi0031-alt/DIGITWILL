import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String },
    role: { type: String, enum: ['owner', 'nominee', 'admin'], default: 'owner' },
    googleId: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    trustedDevices: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
