import mongoose from 'mongoose';

const digitalWillSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, required: true },
    assets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }],
    beneficiaries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Beneficiary' }],
    releaseConditions: {
      waitingPeriodDays: { type: Number, default: 30 },
      adminApprovalRequired: { type: Boolean, default: true },
      notes: { type: String, default: '' },
    },
    summary: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'active'], default: 'draft' },
  },
  { timestamps: true }
);

export default mongoose.model('DigitalWill', digitalWillSchema);
