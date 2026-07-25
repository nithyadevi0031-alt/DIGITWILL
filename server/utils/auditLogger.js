import { AuditLog } from '../models/AuditLog.js';
import { isMongoConnected, memoryStore } from '../config/db.js';
import { parseClientIp, parseUserAgent } from './ipAndDeviceParser.js';

/**
 * Production Audit Logger Helper (Issue 7, 8 & 9)
 */
export async function logAuditEvent({ 
  action, 
  req, 
  userEmail = 'unauthenticated', 
  role = 'owner',
  status = 'SUCCESS',
  description = ''
}) {
  const clientIp = parseClientIp(req);
  const uaMeta = parseUserAgent(req);

  const logEntry = {
    timestamp: new Date(),
    action,
    user: userEmail,
    role,
    status,
    description: description || action,
    clientIp,
    browser: uaMeta.browser,
    os: uaMeta.os,
    device: uaMeta.device,
    userAgent: uaMeta.userAgent,
    sessionId: uaMeta.sessionId,
    requestId: uaMeta.requestId
  };

  // Memory fallback store
  memoryStore.auditLogs.unshift(logEntry);

  // If MongoDB is connected, save to DB
  if (isMongoConnected) {
    try {
      await AuditLog.create(logEntry);
    } catch (err) {
      console.error('[AuditLog Error]:', err.message);
    }
  }

  console.log(`📌 AUDIT LOG [${action}]: ${userEmail} | ${clientIp} | ${uaMeta.browser} on ${uaMeta.os}`);
  return logEntry;
}
