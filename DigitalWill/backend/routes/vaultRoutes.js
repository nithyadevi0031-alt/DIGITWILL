import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Asset from '../models/Asset.js';
import Nominee from '../models/Nominee.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import AuditLog from '../models/AuditLog.js';
import { createAsset, deleteAsset, getAsset, listAssets, updateAsset } from '../controllers/assetController.js';

const router = express.Router();

router.get('/stats', requireAuth, async (req, res) => {
  try {
    const [assets, nominees, requests, logs] = await Promise.all([
      Asset.countDocuments({ ownerId: req.user.id }),
      Nominee.countDocuments({ ownerId: req.user.id }),
      EmergencyRequest.countDocuments({ ownerId: req.user.id }),
      AuditLog.find({ actorId: req.user.id }).sort({ createdAt: -1 }).limit(10),
    ]);

    const pendingRequests = await EmergencyRequest.countDocuments({ ownerId: req.user.id, status: 'pending' });
    const approvedRequests = await EmergencyRequest.countDocuments({ ownerId: req.user.id, status: 'approved' });

    res.json({
      stats: {
        assets,
        nominees,
        pendingRequests,
        approvedRequests,
        recentActivity: logs.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
});

router.get('/assets', requireAuth, listAssets);
router.get('/assets/:id', requireAuth, getAsset);
router.post('/assets', requireAuth, createAsset);
router.put('/assets/:id', requireAuth, updateAsset);
router.delete('/assets/:id', requireAuth, deleteAsset);

router.get('/nominees', requireAuth, async (req, res) => {
  try {
    const nominees = await Nominee.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ nominees });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load nominees' });
  }
});

router.post('/nominees', requireAuth, async (req, res) => {
  try {
    const nominee = await Nominee.create({ ownerId: req.user.id, ...req.body });
    res.status(201).json({ nominee });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create nominee' });
  }
});

router.put('/nominees/:id', requireAuth, async (req, res) => {
  try {
    const nominee = await Nominee.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!nominee) return res.status(404).json({ message: 'Nominee not found' });
    Object.assign(nominee, req.body);
    await nominee.save();
    res.json({ nominee });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update nominee' });
  }
});

router.delete('/nominees/:id', requireAuth, async (req, res) => {
  try {
    const result = await Nominee.deleteOne({ _id: req.params.id, ownerId: req.user.id });
    res.json({ ok: result.deletedCount > 0 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete nominee' });
  }
});

router.get('/requests', requireAuth, async (req, res) => {
  try {
    const requests = await EmergencyRequest.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load requests' });
  }
});

router.post('/requests', requireAuth, async (req, res) => {
  try {
    const request = await EmergencyRequest.create({ ownerId: req.user.id, ...req.body });
    res.status(201).json({ request });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create request' });
  }
});

router.get('/logs', requireAuth, async (req, res) => {
  try {
    const logs = await AuditLog.find({ actorId: req.user.id }).sort({ createdAt: -1 });
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load audit logs' });
  }
});

export default router;
