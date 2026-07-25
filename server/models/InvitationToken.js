import mongoose from 'mongoose';

const InvitationTokenSchema = new mongoose.Schema({
  beneficiaryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' },
  ownerId: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  token: { type: String, required: true, unique: true }, // Hashed SHA256 token
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'], default: 'PENDING' },
  createdAt: { type: Date, default: Date.now }
});

export const InvitationToken = mongoose.model('InvitationToken', InvitationTokenSchema);
