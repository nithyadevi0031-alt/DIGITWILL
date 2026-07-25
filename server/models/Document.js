import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  documentType: {
    type: String,
    required: true,
    enum: [
      'Aadhaar Card',
      'PAN Card',
      'Passport',
      'Driving License',
      'Property Documents',
      'Insurance Documents',
      'Bank Statements',
      'Other Supporting Documents'
    ]
  },
  fileSize: { type: Number, default: 0 },
  allowedNominees: [{ type: String }],
  assignedTo: { type: String, default: '' },
  description: { type: String, default: '' },
  uploadDate: { type: Date, default: Date.now }
});

export const Document = mongoose.model('Document', DocumentSchema);
