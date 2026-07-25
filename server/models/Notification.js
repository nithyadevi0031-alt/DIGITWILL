import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  ownerEmail: { type: String, default: 'alexander@digiwill.ai' },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export const Notification = mongoose.model('Notification', NotificationSchema);
