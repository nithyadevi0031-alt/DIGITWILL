import mongoose from 'mongoose';

const nomineeSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nomineeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    relationship: { type: String, default: '' },
    contactInfo: { type: String, default: '' },
    governmentId: { type: String, default: '' },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    policy: {
      type: String,
      enum: ['view', 'request-only', 'approve', 'deny', 'review-required'],
      default: 'request-only',
    },
    assignedAssets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Nominee', nomineeSchema);
