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
  
  // Smart Document Multi-Factor Verification & Confidence Fields
  detectedTitle: { type: String, default: 'Extracted Document Title' },
  detectedDocumentType: { type: String, default: 'Official Document' },
  keywords: [{ type: String }],
  summary: { type: String, default: '' },
  
  titleMatchScore: { type: Number, default: 90 },
  contentMatchScore: { type: Number, default: 90 },
  categoryMatchScore: { type: Number, default: 100 },
  integrityScore: { type: Number, default: 100 },
  overallConfidence: { type: Number, default: 95 },
  confidenceScore: { type: Number, default: 95 },
  similarityScore: { type: Number, default: 95 },
  validationStatus: { type: String, default: 'Excellent Match' },
  
  uploadDate: { type: Date, default: Date.now }
});

export const Document = mongoose.model('Document', DocumentSchema);
