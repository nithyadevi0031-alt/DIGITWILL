import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const otpCodes = new Map();
const emailVerificationCodes = new Map();
const passwordResetCodes = new Map();
const sessions = new Map();

function signToken(user) {
  return jwt.sign(
    { id: user._id?.toString?.() || user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function createSession(user) {
  const sessionId = crypto.randomBytes(12).toString('hex');
  const session = {
    id: sessionId,
    userId: user._id?.toString?.() || user.id,
    token: sessionId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    active: true,
  };
  sessions.set(session.id, session);
  return session;
}

export async function registerController(req, res) {
  try {
    const { fullName, email, password, role = 'owner' } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role,
      isEmailVerified: true,
      trustedDevices: [],
    });

    const session = createSession(user);
    const token = signToken(user);
    return res.status(201).json({
      token,
      session,
      user: { id: user._id.toString(), fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('registerController error', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
}

export async function loginController(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const session = createSession(user);
    const token = signToken(user);
    return res.json({
      token,
      session,
      user: { id: user._id.toString(), fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('loginController error', error);
    return res.status(500).json({ message: 'Login failed' });
  }
}

export async function profileController(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        mfaEnabled: user.trustedDevices?.length > 0,
      },
    });
  } catch (error) {
    console.error('profileController error', error);
    return res.status(500).json({ message: 'Failed to load profile' });
  }
}

export async function verifyEmailController(req, res) {
  const { code } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const valid = emailVerificationCodes.get(user._id.toString())?.code === code;
  if (valid) {
    user.isEmailVerified = true;
    await user.save();
    emailVerificationCodes.delete(user._id.toString());
  }
  return res.json({ ok: valid });
}

export async function requestEmailVerificationController(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  emailVerificationCodes.set(user._id.toString(), { code, createdAt: Date.now() });
  return res.json({ ok: true, code });
}

export async function requestOtpController(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  otpCodes.set(user._id.toString(), { code, createdAt: Date.now() });
  return res.json({ ok: true, code });
}

export async function verifyOtpController(req, res) {
  const { code } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const valid = otpCodes.get(user._id.toString())?.code === code;
  if (valid) otpCodes.delete(user._id.toString());
  return res.json({ ok: valid });
}

export async function forgotPasswordController(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  passwordResetCodes.set(user._id.toString(), { code, createdAt: Date.now() });
  return res.json({ ok: true, code });
}

export async function resetPasswordController(req, res) {
  const { email, code, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const entry = passwordResetCodes.get(user._id.toString());
  if (!entry || entry.code !== code) return res.json({ ok: false });
  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  passwordResetCodes.delete(user._id.toString());
  return res.json({ ok: true });
}

export async function sessionsController(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ sessions: Array.from(sessions.values()).filter((entry) => entry.userId === user._id.toString()) });
}

export async function logoutAllController(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const count = Array.from(sessions.values()).filter((entry) => entry.userId === user._id.toString()).length;
  for (const entry of sessions.values()) {
    if (entry.userId === user._id.toString()) {
      entry.active = false;
    }
  }
  return res.json({ ok: true, count });
}

export async function logoutSessionController(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const session = sessions.get(req.body.sessionId);
  if (session) {
    session.active = false;
    sessions.set(req.body.sessionId, session);
  }
  return res.json({ ok: !!session, session });
}

export async function deleteAccountController(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await User.findByIdAndDelete(req.user.id);
  for (const [id, entry] of sessions.entries()) {
    if (entry.userId === user._id.toString()) {
      sessions.delete(id);
    }
  }
  return res.json({ ok: true });
}
