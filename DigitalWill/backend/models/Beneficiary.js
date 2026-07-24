import mongoose from 'mongoose';

const beneficiarySchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    notes: { type: String, default: '' },
    assetIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset' }],
    accessPolicy: {
      waitingPeriodDays: { type: Number, default: 30 },
      verificationRequired: { type: Boolean, default: true },
      approvalRequired: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

beneficiarySchema.index({ ownerId: 1, email: 1 }, { unique: false });

export default mongoose.model('Beneficiary', beneficiarySchema);
