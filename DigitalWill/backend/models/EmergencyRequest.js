import mongoose from 'mongoose';

const emergencyRequestSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    nomineeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'denied', 'escalated'],
      default: 'pending',
    },
    verificationStatus: {
      type: String,
      enum: ['not-started', 'in-progress', 'passed', 'failed'],
      default: 'not-started',
    },
    riskScore: { type: Number, default: 0 },
    riskFactors: [{ type: Object }],
    decision: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('EmergencyRequest', emergencyRequestSchema);
