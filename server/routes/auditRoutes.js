import express from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { isMongoConnected, memoryStore } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

/**
 * GET /api/audit-logs — Fetch all audit logs
 */
router.get('/', async (req, res) => {
  try {
    let logs;
    if (isMongoConnected) {
      logs = await AuditLog.find().sort({ timestamp: -1 }).limit(200);
    } else {
      logs = memoryStore.auditLogs;
    }
    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/audit-logs/activity — View Activity Logs (Module 7)
 * Displays Date, Time, User, Action, Module, IP Address, Device, Status
 */
router.get('/activity', async (req, res) => {
  try {
    let logs;
    if (isMongoConnected) {
      logs = await AuditLog.find().sort({ timestamp: -1 }).limit(200);
    } else {
      logs = memoryStore.auditLogs;
    }

    const activities = (logs || []).map(l => {
      const dt = new Date(l.timestamp || Date.now());
      return {
        _id: l._id,
        date: dt.toISOString().split('T')[0],
        time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        user: l.userEmail || l.user || 'System',
        action: l.action || 'Event Logged',
        module: l.description ? l.description.split(' ')[0] + ' Module' : 'Owner Dashboard',
        ipAddress: l.clientIp || l.ip || '127.0.0.1',
        device: l.device || 'Desktop Device',
        status: l.status || 'SUCCESS'
      };
    });

    return res.json({ success: true, activities });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/audit-logs/:id — Delete single audit record
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      const record = await AuditLog.findByIdAndDelete(id);
      if (!record) {
        return res.status(404).json({ success: false, message: 'Audit record not found.' });
      }
    } else {
      const idx = (memoryStore.auditLogs || []).findIndex(l => l._id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Audit record not found.' });
      }
      memoryStore.auditLogs.splice(idx, 1);
    }

    await logAuditEvent({
      action: 'History Deleted',
      req,
      userEmail: req.user?.email || 'owner',
      status: 'SUCCESS',
      description: `Deleted audit record ID: ${id}`
    });

    return res.json({ success: true, message: 'Audit record deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/audit-logs — Delete all audit history
 */
router.delete('/', requireAuth, async (req, res) => {
  try {
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({ success: false, message: 'Confirmation required to delete all audit history.' });
    }

    let deletedCount = 0;

    if (isMongoConnected) {
      const result = await AuditLog.deleteMany({});
      deletedCount = result.deletedCount || 0;
    } else {
      deletedCount = memoryStore.auditLogs.length;
      memoryStore.auditLogs = [];
    }

    // Log final audit entry after deletion
    await logAuditEvent({
      action: 'History Deleted',
      req,
      userEmail: req.user?.email || 'owner',
      status: 'SUCCESS',
      description: `Deleted all audit history (${deletedCount} records)`
    });

    return res.json({ success: true, message: `All audit history deleted (${deletedCount} records).` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
