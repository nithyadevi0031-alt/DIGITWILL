import express from 'express';
import { Notification } from '../models/Notification.js';
import { isMongoConnected, memoryStore } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let notifications;
    if (isMongoConnected) {
      notifications = await Notification.find().sort({ createdAt: -1 }).limit(20);
    } else {
      notifications = memoryStore.notifications;
    }
    return res.json({ notifications });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/read-all', async (req, res) => {
  try {
    if (isMongoConnected) {
      await Notification.updateMany({ read: false }, { read: true });
    } else {
      memoryStore.notifications.forEach(n => (n.read = true));
    }
    return res.json({ message: 'All notifications marked read.' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
