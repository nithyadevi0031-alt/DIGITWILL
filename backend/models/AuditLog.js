import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: String },
    details: { type: Object, default: {} },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', auditLogSchema);
