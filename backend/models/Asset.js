import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assetType: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    securityLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    emergencyPolicy: { type: String, default: 'review-required' },
    encryptedData: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    metadata: { type: Object, default: {} },
    accessHistory: [{ type: Object }],
    encrypted: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Asset', assetSchema);
