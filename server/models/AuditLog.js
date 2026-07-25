import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true },
  user: { type: String, required: true },
  role: { type: String, default: 'owner' },
  status: { type: String, default: 'SUCCESS' },
  description: { type: String },
  clientIp: { type: String, default: '127.0.0.1 (Localhost)' },
  browser: { type: String, default: 'Chrome' },
  os: { type: String, default: 'Windows 11' },
  device: { type: String, default: 'Desktop' },
  userAgent: { type: String },
  sessionId: { type: String },
  requestId: { type: String }
});

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
