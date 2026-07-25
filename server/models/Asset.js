import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  assetName: { type: String, required: true, trim: true },
  assetType: {
    type: String,
    required: true,
    enum: [
      'Bank Account',
      'Property',
      'Gold',
      'Mutual Funds',
      'Shares',
      'Vehicle',
      'Cryptocurrency',
      'Insurance',
      'Digital Assets',
      'Others'
    ]
  },
  estimatedValue: { type: String, required: true, trim: true },
  assignedBeneficiary: { type: String, required: true, trim: true },
  nomineeEmail: { type: String, trim: true, lowercase: true, default: '' },
  ownerName: { type: String, trim: true, default: 'Vault Owner' },
  encryptionStatus: { type: String, default: 'AES-256 Encrypted' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Asset = mongoose.model('Asset', AssetSchema);
