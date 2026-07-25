import mongoose from 'mongoose';

const WillSchema = new mongoose.Schema({
  ownerId: { type: String, required: true }, // Associated user / owner ID
  willTitle: { type: String, required: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  dob: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  executorName: { type: String, required: true, trim: true },
  specialInstructions: { type: String, trim: true },
  beneficiaries: [
    {
      name: { type: String, trim: true },
      beneficiaryEmail: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
      assignedAssets: [{ type: String }],
      percentage: { type: String, default: '100%' },
      notes: { type: String, trim: true },
      releaseConditions: { type: String, default: 'Death certificate or emergency release verification' },
      status: { type: String, default: 'Assigned' }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Will = mongoose.model('Will', WillSchema);
