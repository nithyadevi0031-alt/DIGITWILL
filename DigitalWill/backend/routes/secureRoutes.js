import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { changePassword, deleteUser, getAuditLog, getStoreSnapshot, getUserById, resetDemoData, revokeAllSessions, revokeSession, seedDemoData, updateUser } from '../utils/appStore.js';

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user });
});

router.put('/me', requireAuth, (req, res) => {
  const updated = updateUser(req.user.id, req.body);
  if (!updated) return res.status(404).json({ message: 'User not found' });
  return res.json({ user: updated });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const updated = await changePassword(req.user.id, req.body.password);
  if (!updated) return res.status(404).json({ message: 'User not found' });
  return res.json({ ok: true });
});

router.post('/logout', requireAuth, (req, res) => {
  const sessionId = req.body.sessionId;
  const session = sessionId ? revokeSession(sessionId, getUserById(req.user.id)) : null;
  return res.json({ ok: true, session });
});

router.post('/logout-all', requireAuth, (req, res) => {
  const count = revokeAllSessions(req.user.id, getUserById(req.user.id));
  return res.json({ ok: true, count });
});

router.delete('/me', requireAuth, (req, res) => {
  const deleted = deleteUser(req.user.id);
  return res.json({ ok: deleted });
});

router.get('/audit', requireAuth, requireRole(['admin', 'owner']), (req, res) => {
  return res.json({ auditLog: getAuditLog() });
});

router.get('/store', requireAuth, requireRole(['admin']), (_req, res) => {
  return res.json({ store: getStoreSnapshot() });
});

router.post('/demo/seed', requireAuth, requireRole(['admin']), (_req, res) => {
  return res.json({ users: seedDemoData() });
});

router.post('/demo/reset', requireAuth, requireRole(['admin']), (_req, res) => {
  return res.json({ users: resetDemoData() });
});

export default router;
