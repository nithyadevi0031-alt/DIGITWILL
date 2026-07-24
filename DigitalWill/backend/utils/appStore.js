import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { encryptSensitiveData, decryptSensitiveData } from './encryption.js';
import { evaluateRisk } from './riskEngine.js';

const store = {
  users: [],
  sessions: [],
  assets: [],
  nominees: [],
  requests: [],
  auditLog: [],
  otpCodes: new Map(),
  passwordReset: new Map(),
  emailVerification: new Map(),
};

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeTimestamp() {
  return new Date().toISOString();
}

function addAudit(event) {
  store.auditLog.unshift({ id: uid('audit'), createdAt: makeTimestamp(), ...event });
}

export function getStoreSnapshot() {
  return {
    users: store.users,
    sessions: store.sessions,
    assets: store.assets,
    nominees: store.nominees,
    requests: store.requests,
    auditLog: store.auditLog,
  };
}

export async function registerUser({ fullName, email, password, role = 'owner' }) {
  const existing = store.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: uid('user'),
    fullName,
    email: email.toLowerCase(),
    passwordHash,
    role,
    isEmailVerified: true,
    mfaEnabled: false,
    phone: '',
    dob: '',
    address: '',
    theme: 'dark',
    notifications: true,
    createdAt: makeTimestamp(),
  };

  store.users.push(user);
  addAudit({ actorId: user.id, actorRole: user.role, action: 'register', targetType: 'user', targetId: user.id, details: { email: user.email }, severity: 'info' });
  return user;
}

export async function authenticateUser({ email, password }) {
  const user = store.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  if (!user || !user.passwordHash) {
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  return user;
}

export function createSession(user) {
  const token = crypto.randomBytes(24).toString('hex');
  const session = {
    id: uid('session'),
    userId: user.id,
    token,
    createdAt: makeTimestamp(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    active: true,
  };
  store.sessions.push(session);
  addAudit({ actorId: user.id, actorRole: user.role, action: 'login', targetType: 'session', targetId: session.id, details: {}, severity: 'info' });
  return session;
}

export function getSessionByToken(token) {
  return store.sessions.find((session) => session.token === token && session.active);
}

export function getActiveSessionForUser(userId) {
  return store.sessions.find((session) => session.userId === userId && session.active && Date.now() < new Date(session.expiresAt).getTime());
}

export function getUserSessions(userId) {
  return store.sessions.filter((session) => session.userId === userId);
}

export function revokeSession(sessionId, actor) {
  const session = store.sessions.find((entry) => entry.id === sessionId);
  if (!session) return null;
  session.active = false;
  addAudit({ actorId: actor?.id, actorRole: actor?.role, action: 'logout-session', targetType: 'session', targetId: session.id, details: {}, severity: 'warning' });
  return session;
}

export function revokeAllSessions(userId, actor) {
  let count = 0;
  store.sessions.forEach((session) => {
    if (session.userId === userId) {
      session.active = false;
      count += 1;
    }
  });
  if (count > 0) {
    addAudit({ actorId: actor?.id, actorRole: actor?.role, action: 'logout-all-sessions', targetType: 'user', targetId: userId, details: { count }, severity: 'warning' });
  }
  return count;
}

export function getUserById(userId) {
  return store.users.find((user) => user.id === userId) || null;
}

export function getUserByEmail(email) {
  return store.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

export function updateUser(userId, updates) {
  const user = getUserById(userId);
  if (!user) return null;
  Object.assign(user, updates);
  return user;
}

export function deleteUser(userId) {
  const idx = store.users.findIndex((user) => user.id === userId);
  if (idx < 0) return false;
  store.users.splice(idx, 1);
  store.sessions = store.sessions.filter((session) => session.userId !== userId);
  store.assets = store.assets.filter((asset) => asset.ownerId !== userId);
  store.nominees = store.nominees.filter((nominee) => nominee.ownerId !== userId && nominee.nomineeId !== userId);
  store.requests = store.requests.filter((request) => request.ownerId !== userId && request.nomineeId !== userId);
  addAudit({ actorId: userId, actorRole: 'owner', action: 'delete-account', targetType: 'user', targetId: userId, details: {}, severity: 'critical' });
  return true;
}

export async function changePassword(userId, newPassword) {
  const user = getUserById(userId);
  if (!user) return null;
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  addAudit({ actorId: userId, actorRole: user.role, action: 'password-change', targetType: 'user', targetId: userId, details: {}, severity: 'warning' });
  return user;
}

export function requestOtp(userId, code) {
  store.otpCodes.set(userId, { code, createdAt: Date.now(), expiresAt: Date.now() + 5 * 60 * 1000 });
  addAudit({ actorId: userId, actorRole: 'owner', action: 'otp-request', targetType: 'user', targetId: userId, details: {}, severity: 'info' });
}

export function verifyOtp(userId, code) {
  const entry = store.otpCodes.get(userId);
  if (!entry) return false;
  const valid = entry.code === code && Date.now() < entry.expiresAt;
  if (valid) {
    store.otpCodes.delete(userId);
    addAudit({ actorId: userId, actorRole: 'owner', action: 'otp-verify', targetType: 'user', targetId: userId, details: {}, severity: 'info' });
  }
  return valid;
}

export function requestEmailVerification(userId, code) {
  store.emailVerification.set(userId, { code, createdAt: Date.now(), expiresAt: Date.now() + 10 * 60 * 1000 });
  return code;
}

export function verifyEmail(userId, code) {
  const entry = store.emailVerification.get(userId);
  if (!entry) return false;
  const valid = entry.code === code && Date.now() < entry.expiresAt;
  if (valid) {
    store.emailVerification.delete(userId);
    const user = getUserById(userId);
    if (user) {
      user.isEmailVerified = true;
      addAudit({ actorId: userId, actorRole: user.role, action: 'verify-email', targetType: 'user', targetId: userId, details: {}, severity: 'info' });
    }
  }
  return valid;
}

export function requestPasswordReset(userId, code) {
  store.passwordReset.set(userId, { code, createdAt: Date.now(), expiresAt: Date.now() + 10 * 60 * 1000 });
  return code;
}

export function resetPassword(userId, code, newPassword) {
  const entry = store.passwordReset.get(userId);
  if (!entry || entry.code !== code || Date.now() > entry.expiresAt) {
    return false;
  }

  const user = getUserById(userId);
  if (!user) return false;
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  store.passwordReset.delete(userId);
  addAudit({ actorId: userId, actorRole: user.role, action: 'reset-password', targetType: 'user', targetId: userId, details: {}, severity: 'warning' });
  return true;
}

export function createAsset({ ownerId, assetType, name, value, category, securityLevel, emergencyPolicy }) {
  const encrypted = encryptSensitiveData(JSON.stringify({ value }));
  const asset = {
    id: uid('asset'),
    ownerId,
    assetType,
    name,
    category,
    securityLevel,
    emergencyPolicy,
    encryptedData: encrypted.encryptedData,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    encrypted: true,
    createdAt: makeTimestamp(),
  };
  store.assets.push(asset);
  addAudit({ actorId: ownerId, actorRole: 'owner', action: 'asset-create', targetType: 'asset', targetId: asset.id, details: { name, category }, severity: 'info' });
  return asset;
}

export function getAssetsForUser(ownerId) {
  return store.assets.filter((asset) => asset.ownerId === ownerId);
}

export function updateAsset(assetId, updates) {
  const asset = store.assets.find((entry) => entry.id === assetId);
  if (!asset) return null;
  Object.assign(asset, updates);
  return asset;
}

export function deleteAsset(assetId) {
  const index = store.assets.findIndex((asset) => asset.id === assetId);
  if (index < 0) return false;
  store.assets.splice(index, 1);
  return true;
}

export function createNominee({ ownerId, nomineeId, relationship, policy, contactInfo }) {
  const nominee = {
    id: uid('nominee'),
    ownerId,
    nomineeId,
    relationship,
    policy,
    contactInfo,
    governmentId: null,
    verificationStatus: 'pending',
    assets: [],
    createdAt: makeTimestamp(),
  };
  store.nominees.push(nominee);
  addAudit({ actorId: ownerId, actorRole: 'owner', action: 'nominee-create', targetType: 'nominee', targetId: nominee.id, details: { relationship }, severity: 'info' });
  return nominee;
}

export function updateNominee(nomineeId, updates) {
  const nominee = store.nominees.find((entry) => entry.id === nomineeId);
  if (!nominee) return null;
  Object.assign(nominee, updates);
  return nominee;
}

export function deleteNominee(nomineeId) {
  const index = store.nominees.findIndex((nominee) => nominee.id === nomineeId);
  if (index < 0) return false;
  store.nominees.splice(index, 1);
  return true;
}

export function createEmergencyRequest({ ownerId, nomineeId, policy }) {
  const request = {
    id: uid('request'),
    ownerId,
    nomineeId,
    policy,
    status: 'pending',
    verificationStatus: 'in-progress',
    riskScore: 0,
    riskFactors: [],
    decision: '',
    createdAt: makeTimestamp(),
  };

  const risk = evaluateRisk({
    deviceTrust: 0.72,
    loginHistory: 0.81,
    verificationCompleteness: 0.65,
    locationPattern: 'consistent',
  });

  request.riskScore = risk.riskScore;
  request.riskFactors = risk.factors;
  request.decision = risk.recommendation;

  store.requests.push(request);
  addAudit({ actorId: nomineeId, actorRole: 'nominee', action: 'emergency-request', targetType: 'request', targetId: request.id, details: { policy }, severity: 'warning' });
  return request;
}

export function updateEmergencyRequest(requestId, updates) {
  const request = store.requests.find((entry) => entry.id === requestId);
  if (!request) return null;
  Object.assign(request, updates);
  return request;
}

export function getAuditLog() {
  return store.auditLog;
}

export function seedDemoData() {
  const owner = store.users.find((user) => user.role === 'owner');
  if (owner) return { owner, nominee: store.users.find((user) => user.role === 'nominee'), admin: store.users.find((user) => user.role === 'admin') };

  const ownerUser = {
    id: uid('user'),
    fullName: 'Ava Chen',
    email: 'owner@digitalwill.ai',
    passwordHash: bcrypt.hashSync('Secure123!', 10),
    role: 'owner',
    isEmailVerified: true,
    mfaEnabled: true,
    phone: '+1 202 555 0100',
    dob: '1990-03-18',
    address: '401 Market Street, Seattle, WA',
    theme: 'dark',
    notifications: true,
    createdAt: makeTimestamp(),
  };
  const nomineeUser = {
    id: uid('user'),
    fullName: 'Jordan Lee',
    email: 'nominee@digitalwill.ai',
    passwordHash: bcrypt.hashSync('Secure123!', 10),
    role: 'nominee',
    isEmailVerified: true,
    mfaEnabled: false,
    phone: '+1 202 555 0101',
    dob: '1988-04-12',
    address: '302 Pine Avenue, Austin, TX',
    theme: 'dark',
    notifications: true,
    createdAt: makeTimestamp(),
  };
  const adminUser = {
    id: uid('user'),
    fullName: 'Mina Patel',
    email: 'admin@digitalwill.ai',
    passwordHash: bcrypt.hashSync('Secure123!', 10),
    role: 'admin',
    isEmailVerified: true,
    mfaEnabled: true,
    phone: '+1 202 555 0102',
    dob: '1985-08-30',
    address: '1200 Harbor Drive, Chicago, IL',
    theme: 'dark',
    notifications: true,
    createdAt: makeTimestamp(),
  };

  store.users.push(ownerUser, nomineeUser, adminUser);
  createAsset({ ownerId: ownerUser.id, assetType: 'bank', name: 'Checking Account', value: 'Primary checking', category: 'bank', securityLevel: 'high', emergencyPolicy: 'review-required' });
  createAsset({ ownerId: ownerUser.id, assetType: 'cloud', name: 'Google Drive Vault', value: 'Archive folder', category: 'cloud storage', securityLevel: 'high', emergencyPolicy: 'review-required' });
  createNominee({ ownerId: ownerUser.id, nomineeId: nomineeUser.id, relationship: 'Sibling', policy: 'review-required', contactInfo: 'jordan.lee@example.com' });
  createEmergencyRequest({ ownerId: ownerUser.id, nomineeId: nomineeUser.id, policy: 'review-required' });
  addAudit({ actorId: adminUser.id, actorRole: adminUser.role, action: 'seed-demo', targetType: 'system', targetId: 'demo', details: {}, severity: 'info' });

  return { owner: ownerUser, nominee: nomineeUser, admin: adminUser };
}

export function resetDemoData() {
  store.users.length = 0;
  store.sessions.length = 0;
  store.assets.length = 0;
  store.nominees.length = 0;
  store.requests.length = 0;
  store.auditLog.length = 0;
  store.otpCodes.clear();
  store.passwordReset.clear();
  return seedDemoData();
}
