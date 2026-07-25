import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  device: { type: String },
  details: { type: String }
});

const BeneficiarySchema = new mongoose.Schema({
  ownerId: { type: String, default: 'default_owner_id' },
  ownerName: { type: String, default: 'Alexander Vance' },
  ownerEmail: { type: String, default: 'alexander@digiwill.ai' },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  relationship: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined', 'Expired', 'Verified'],
    default: 'Pending'
  },
  invitationToken: { type: String }, // Hashed token
  tokenExpiry: { type: Date },
  acceptedAt: { type: Date },
  verifiedAt: { type: Date },
  lastInvitationSent: { type: Date, default: Date.now },
  resendCount: { type: Number, default: 0 },
  deviceInfo: { type: String, default: 'Unknown Device' },
  ipAddress: { type: String, default: '127.0.0.1' },
  browser: { type: String, default: 'Unknown Browser' },
  location: { type: String, default: 'San Francisco, CA (US)' },
  activityLogs: [ActivityLogSchema],
  createdAt: { type: Date, default: Date.now }
});

export const Beneficiary = mongoose.model('Beneficiary', BeneficiarySchema);
