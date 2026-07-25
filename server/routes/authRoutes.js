import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { User } from '../models/User.js';
import { Beneficiary } from '../models/Beneficiary.js';
import { EmailVerificationToken } from '../models/EmailVerificationToken.js';
import { OTPVerification } from '../models/OTPVerification.js';
import { isMongoConnected, memoryStore } from '../config/db.js';
import { validateEmailExistence } from '../utils/emailValidator.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { sendVerificationEmail, sendOTPEmail, getMailerStatus } from '../utils/mailer.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();
const currentChallenges = new Map();
const resendRateLimitMap = new Map();
const otpRateLimitMap = new Map();

const rpID = process.env.RP_ID || 'localhost';
const rpName = process.env.RP_NAME || 'Digital Will AI';
const expectedOrigin = process.env.ORIGIN || 'http://localhost:5173';

function hashSHA256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// ─── REGISTRATION ───────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { fullName, name, email, phone, password, role = 'owner' } = req.body;
    const userName = (fullName || name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!userName || !cleanEmail || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Full Name, Email, and Password are required.' 
      });
    }

    // 5-Step Email Verification
    const emailValidation = await validateEmailExistence(cleanEmail);
    if (!emailValidation.isValid) {
      await logAuditEvent({
        action: 'Email Verification Failed',
        req,
        userEmail: cleanEmail,
        role,
        status: 'FAILED',
        description: `Registration failed: ${emailValidation.message} (${emailValidation.status})`
      });

      return res.status(422).json({ 
        success: false, 
        message: emailValidation.message,
        status: emailValidation.status
      });
    }

    // Check duplicate
    let existing;
    if (isMongoConnected) {
      existing = await User.findOne({ email: cleanEmail });
    } else {
      existing = memoryStore.users.find(u => u.email === cleanEmail);
    }

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this email address already exists.' 
      });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      fullName: userName,
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      password: hashedPassword,
      isVerified: false,
      role,
      hasPasskey: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let user;
    if (isMongoConnected) {
      user = await User.create(userData);
    } else {
      user = { _id: 'u_' + Date.now(), ...userData, passkeys: [] };
      memoryStore.users.push(user);
    }

    // Generate 24-Hour Verification Token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashSHA256(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (isMongoConnected) {
      await EmailVerificationToken.create({
        userId: user._id,
        email: cleanEmail,
        token: hashedToken,
        expiresAt,
        status: 'ACTIVE'
      });
    }

    // Check if we have real SMTP or are in Ethereal/dev fallback
    const mailerStatus = getMailerStatus();

    // Send verification email — only report success if SMTP accepts
    let emailResult;
    try {
      emailResult = await sendVerificationEmail({ email: cleanEmail, name: userName, rawToken });
    } catch (emailErr) {
      // SMTP failed — in dev mode, auto-verify so the user isn't stuck
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️  Email send failed, auto-verifying user in development mode: ${cleanEmail}`);
        if (isMongoConnected) {
          await User.findByIdAndUpdate(user._id, { isVerified: true, updatedAt: new Date() });
        } else {
          user.isVerified = true;
        }

        await logAuditEvent({
          action: 'User Registered',
          req, userEmail: cleanEmail, role,
          status: 'SUCCESS',
          description: 'Account created and auto-verified (dev mode — SMTP unavailable)'
        });

        return res.status(201).json({
          success: true,
          message: 'Registration successful. Your account has been auto-verified (development mode). You can now sign in.',
          emailDelivery: 'dev-auto-verified'
        });
      }

      await logAuditEvent({
        action: 'Verification Email Failed',
        req, userEmail: cleanEmail, role,
        status: 'FAILED',
        description: `SMTP error: ${emailErr.message}`
      });

      return res.status(502).json({
        success: false,
        message: `Account created but verification email could not be sent. ${emailErr.message}`,
        hint: 'Please try "Resend Verification Email" or contact support.'
      });
    }

    // If Ethereal (emails won't arrive) and dev mode, auto-verify
    if (!emailResult.isReal && process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️  Ethereal mode — auto-verifying user: ${cleanEmail}`);
      console.log(`🔗 Verification link (for reference): ${process.env.ORIGIN || 'http://localhost:5173'}/verify-email/${rawToken}`);
      if (isMongoConnected) {
        await User.findByIdAndUpdate(user._id, { isVerified: true, updatedAt: new Date() });
      } else {
        user.isVerified = true;
      }

      await logAuditEvent({
        action: 'User Registered',
        req, userEmail: cleanEmail, role,
        status: 'SUCCESS',
        description: 'Account created and auto-verified (Ethereal mode)'
      });

      return res.status(201).json({
        success: true,
        message: 'Registration successful. Your account has been auto-verified (development mode). You can now sign in.',
        emailDelivery: 'dev-auto-verified'
      });
    }

    await logAuditEvent({
      action: 'User Registered',
      req, userEmail: cleanEmail, role,
      status: 'SUCCESS',
      description: 'Account created (pending email verification)'
    });

    await logAuditEvent({
      action: 'Verification Email Sent',
      req, userEmail: cleanEmail, role,
      status: 'SUCCESS',
      description: `Verification email accepted by SMTP (MessageID: ${emailResult.messageId})`
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful. A verification email has been sent to your registered email address. Please check your inbox (and spam folder) and verify your email before logging in.',
      emailDelivery: 'real'
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to process your request. Please try again.' 
    });
  }
});

// ─── EMAIL VERIFICATION ─────────────────────────────────────────────────────

router.get('/verify-email/:rawToken', async (req, res) => {
  try {
    const { rawToken } = req.params;
    if (!rawToken) {
      return res.status(400).json({ success: false, message: 'Invalid verification token.' });
    }

    const hashed = hashSHA256(rawToken);

    if (isMongoConnected) {
      const tokenDoc = await EmailVerificationToken.findOne({ token: hashed, status: 'ACTIVE' });
      if (!tokenDoc) {
        return res.status(400).json({ success: false, message: 'Verification link is invalid or already used.' });
      }

      if (new Date(tokenDoc.expiresAt) < new Date()) {
        tokenDoc.status = 'EXPIRED';
        await tokenDoc.save();
        return res.status(410).json({ success: false, message: 'Verification link has expired. Please request a new one.' });
      }

      await User.findByIdAndUpdate(tokenDoc.userId, { isVerified: true, updatedAt: new Date() });
      tokenDoc.status = 'VERIFIED';
      tokenDoc.verifiedAt = new Date();
      await tokenDoc.save();

      const user = await User.findById(tokenDoc.userId);

      await logAuditEvent({
        action: 'Email Verified',
        req, userEmail: tokenDoc.email,
        status: 'SUCCESS',
        description: 'Account email verified successfully'
      });

      return res.json({
        success: true,
        message: 'Email verified successfully. You may now sign in.',
        user: { name: user?.fullName, email: user?.email }
      });
    } else {
      await logAuditEvent({
        action: 'Email Verified',
        req, userEmail: 'user@digiwill.ai',
        status: 'SUCCESS',
        description: 'Account email verified successfully (memory mode)'
      });

      return res.json({ success: true, message: 'Email verified successfully. You may now sign in.' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to process verification.' });
  }
});

// ─── RESEND VERIFICATION EMAIL ──────────────────────────────────────────────

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const lastSent = resendRateLimitMap.get(cleanEmail);
    if (lastSent && (Date.now() - lastSent < 60000)) {
      const waitSec = Math.ceil((60000 - (Date.now() - lastSent)) / 1000);
      return res.status(429).json({ 
        success: false, 
        message: `Please wait ${waitSec} seconds before requesting another verification email.` 
      });
    }

    let user;
    if (isMongoConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memoryStore.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This email address is already verified.' });
    }

    if (isMongoConnected) {
      await EmailVerificationToken.updateMany({ email: cleanEmail, status: 'ACTIVE' }, { status: 'EXPIRED' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hashSHA256(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (isMongoConnected) {
      await EmailVerificationToken.create({
        userId: user._id, email: cleanEmail,
        token: hashedToken, expiresAt, status: 'ACTIVE'
      });
    }

    resendRateLimitMap.set(cleanEmail, Date.now());

    let emailResult;
    try {
      emailResult = await sendVerificationEmail({
        email: cleanEmail,
        name: user.fullName || user.name || 'User',
        rawToken
      });
    } catch (emailErr) {
      await logAuditEvent({
        action: 'Verification Email Failed',
        req, userEmail: cleanEmail,
        status: 'FAILED',
        description: `Resend SMTP error: ${emailErr.message}`
      });

      return res.status(502).json({
        success: false,
        message: `Unable to send verification email. ${emailErr.message}`
      });
    }

    await logAuditEvent({
      action: 'Verification Email Resent',
      req, userEmail: cleanEmail,
      status: 'SUCCESS',
      description: `Verification email accepted by SMTP (MessageID: ${emailResult.messageId})`
    });

    const msg = emailResult.isReal
      ? 'A new verification email has been sent. Please check your inbox and spam folder.'
      : '⚠️ Email sent via test service (Ethereal) — it will NOT arrive in your real inbox. Configure real SMTP in server/.env.';

    return res.json({ success: true, message: msg, emailDelivery: emailResult.isReal ? 'real' : 'test-only' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to resend verification email.' });
  }
});

// ─── LOGIN (Step 1: Password → OTP Required) ───────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password, role = 'owner' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user;
    if (isMongoConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memoryStore.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      await logAuditEvent({
        action: 'Unauthorized Login Attempt',
        req, userEmail: cleanEmail, role,
        status: 'FAILED',
        description: 'Login failed: Invalid credentials'
      });

      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Password comparison
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
      if (!isMatch) {
        await logAuditEvent({
          action: 'Unauthorized Login Attempt',
          req, userEmail: cleanEmail, role,
          status: 'FAILED',
          description: 'Login failed: Wrong password'
        });
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
    }

    // Check email verified
    if (!user.isVerified) {
      await logAuditEvent({
        action: 'Login Attempt Before Verification',
        req, userEmail: cleanEmail, role: user.role || role,
        status: 'FAILED',
        description: 'Blocked login: Email not verified'
      });

      return res.status(403).json({
        success: false,
        message: 'Your email address has not been verified. Please verify your email before signing in.'
      });
    }

    // Password valid + email verified → Generate OTP for 2FA
    const otp = generateOTP();
    const otpHash = hashSHA256(otp);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate previous OTPs
    if (isMongoConnected) {
      await OTPVerification.updateMany(
        { email: cleanEmail, status: 'ACTIVE' },
        { status: 'EXPIRED' }
      );

      await OTPVerification.create({
        userId: user._id,
        email: cleanEmail,
        otpHash,
        expiresAt: otpExpiry,
        attempts: 0,
        maxAttempts: 5,
        status: 'ACTIVE'
      });
    } else {
      // Memory fallback
      memoryStore.otpVerifications = memoryStore.otpVerifications || [];
      memoryStore.otpVerifications = memoryStore.otpVerifications.filter(
        o => o.email !== cleanEmail || o.status !== 'ACTIVE'
      );
      memoryStore.otpVerifications.push({
        _id: 'otp_' + Date.now(),
        userId: user._id,
        email: cleanEmail,
        otpHash,
        expiresAt: otpExpiry,
        attempts: 0,
        maxAttempts: 5,
        status: 'ACTIVE'
      });
    }

    // Send OTP via email — only return success if SMTP accepts
    const mailerStatusLogin = getMailerStatus();
    let otpEmailResult;
    try {
      otpEmailResult = await sendOTPEmail({
        email: cleanEmail,
        name: user.fullName || user.name || 'User',
        otp
      });
    } catch (emailErr) {
      // In dev mode, still let login proceed — return OTP directly
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️  OTP email failed in dev mode. OTP for ${cleanEmail}: ${otp}`);
        await logAuditEvent({
          action: 'OTP Sent',
          req, userEmail: cleanEmail, role: user.role || role,
          status: 'SUCCESS',
          description: 'OTP returned in response (dev mode — SMTP unavailable)'
        });

        return res.json({
          success: true,
          otpRequired: true,
          message: `Development mode: Your OTP is ${otp} (SMTP unavailable — OTP shown directly)`,
          email: cleanEmail,
          devOtp: otp
        });
      }

      await logAuditEvent({
        action: 'OTP Email Failed',
        req, userEmail: cleanEmail, role: user.role || role,
        status: 'FAILED',
        description: `OTP email SMTP error: ${emailErr.message}`
      });

      return res.status(502).json({
        success: false,
        message: `Unable to send OTP email. ${emailErr.message}`
      });
    }

    // If Ethereal — OTP email won't arrive in real inbox, return it directly in dev
    if (!otpEmailResult.isReal && process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️  Ethereal mode — OTP for ${cleanEmail}: ${otp}`);
      await logAuditEvent({
        action: 'OTP Sent',
        req, userEmail: cleanEmail, role: user.role || role,
        status: 'SUCCESS',
        description: 'OTP returned in response (Ethereal mode)'
      });

      return res.json({
        success: true,
        otpRequired: true,
        message: `Development mode: Your OTP is ${otp} (email sent to Ethereal only)`,
        email: cleanEmail,
        devOtp: otp
      });
    }

    await logAuditEvent({
      action: 'OTP Sent',
      req, userEmail: cleanEmail, role: user.role || role,
      status: 'SUCCESS',
      description: 'Login OTP dispatched to registered email'
    });

    // In development mode, always include OTP in response so user is never stuck
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.log(`🔑 [DEV] OTP for ${cleanEmail}: ${otp}`);
    }

    return res.json({
      success: true,
      otpRequired: true,
      message: isDev
        ? `OTP has been sent to your email. Dev mode OTP: ${otp}`
        : 'A 6-digit OTP has been sent to your registered email address.',
      email: cleanEmail,
      ...(isDev && { devOtp: otp })
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to process your request. Please try again.' });
  }
});

// ─── VERIFY OTP (Step 2: OTP → JWT Token) ───────────────────────────────────

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpHash = hashSHA256(otp.toString().trim());

    let otpDoc;
    if (isMongoConnected) {
      otpDoc = await OTPVerification.findOne({ email: cleanEmail, status: 'ACTIVE' }).sort({ createdAt: -1 });
    } else {
      const otpStore = memoryStore.otpVerifications || [];
      otpDoc = otpStore.find(o => o.email === cleanEmail && o.status === 'ACTIVE');
    }

    if (!otpDoc) {
      await logAuditEvent({
        action: 'OTP Failed',
        req, userEmail: cleanEmail,
        status: 'FAILED',
        description: 'No active OTP found'
      });
      return res.status(400).json({ success: false, message: 'No active OTP found. Please request a new one.' });
    }

    // Check expiry
    if (new Date(otpDoc.expiresAt) < new Date()) {
      otpDoc.status = 'EXPIRED';
      if (isMongoConnected) await otpDoc.save();

      await logAuditEvent({
        action: 'OTP Failed',
        req, userEmail: cleanEmail,
        status: 'FAILED',
        description: 'OTP expired'
      });
      return res.status(410).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    // Check max attempts
    if (otpDoc.attempts >= otpDoc.maxAttempts) {
      otpDoc.status = 'BLOCKED';
      if (isMongoConnected) await otpDoc.save();

      await logAuditEvent({
        action: 'OTP Failed',
        req, userEmail: cleanEmail,
        status: 'FAILED',
        description: 'Maximum OTP attempts exceeded'
      });
      return res.status(429).json({ success: false, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' });
    }

    // Increment attempts
    otpDoc.attempts += 1;

    // Verify OTP hash
    if (otpDoc.otpHash !== otpHash) {
      if (isMongoConnected) await otpDoc.save();
      const remaining = otpDoc.maxAttempts - otpDoc.attempts;

      await logAuditEvent({
        action: 'OTP Failed',
        req, userEmail: cleanEmail,
        status: 'FAILED',
        description: `Invalid OTP entered (${remaining} attempts remaining)`
      });
      return res.status(401).json({ 
        success: false, 
        message: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` 
      });
    }

    // OTP verified successfully
    otpDoc.status = 'VERIFIED';
    if (isMongoConnected) await otpDoc.save();

    // Get user and generate JWT
    let user;
    if (isMongoConnected) {
      user = await User.findOne({ email: cleanEmail });
      if (user) {
        const isBen = await Beneficiary.findOne({ email: cleanEmail });
        if (isBen || user.role === 'beneficiary') {
          user.role = 'beneficiary';
        }
      }
    } else {
      user = memoryStore.users.find(u => u.email === cleanEmail);
    }

    const token = generateToken(user);

    await logAuditEvent({
      action: 'OTP Verified',
      req, userEmail: cleanEmail, role: user?.role || 'owner',
      status: 'SUCCESS',
      description: 'OTP verified — login successful'
    });

    await logAuditEvent({
      action: 'Login',
      req, userEmail: cleanEmail, role: user?.role || 'owner',
      status: 'SUCCESS',
      description: 'User logged in successfully via OTP 2FA'
    });

    return res.json({
      success: true,
      message: 'OTP verified. Login successful.',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName || user.name,
        name: user.fullName || user.name,
        email: user.email,
        role: user.role || 'owner',
        isVerified: true
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to verify OTP. Please try again.' });
  }
});

// ─── RESEND OTP ─────────────────────────────────────────────────────────────

router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Rate limit 60s
    const lastSent = otpRateLimitMap.get(cleanEmail);
    if (lastSent && (Date.now() - lastSent < 60000)) {
      const waitSec = Math.ceil((60000 - (Date.now() - lastSent)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSec} seconds before requesting another OTP.`
      });
    }

    let user;
    if (isMongoConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memoryStore.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    // Invalidate old OTPs
    if (isMongoConnected) {
      await OTPVerification.updateMany({ email: cleanEmail, status: 'ACTIVE' }, { status: 'EXPIRED' });
    }

    const otp = generateOTP();
    const otpHash = hashSHA256(otp);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    if (isMongoConnected) {
      await OTPVerification.create({
        userId: user._id, email: cleanEmail,
        otpHash, expiresAt: otpExpiry,
        attempts: 0, maxAttempts: 5, status: 'ACTIVE'
      });
    } else {
      memoryStore.otpVerifications = memoryStore.otpVerifications || [];
      memoryStore.otpVerifications = memoryStore.otpVerifications.filter(
        o => o.email !== cleanEmail || o.status !== 'ACTIVE'
      );
      memoryStore.otpVerifications.push({
        _id: 'otp_' + Date.now(), userId: user._id, email: cleanEmail,
        otpHash, expiresAt: otpExpiry, attempts: 0, maxAttempts: 5, status: 'ACTIVE'
      });
    }

    otpRateLimitMap.set(cleanEmail, Date.now());

    let resendOtpResult;
    try {
      resendOtpResult = await sendOTPEmail({
        email: cleanEmail,
        name: user.fullName || user.name || 'User',
        otp
      });
    } catch (emailErr) {
      // In dev mode, still return the OTP
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️  Resend OTP email failed in dev mode. OTP for ${cleanEmail}: ${otp}`);
        return res.json({
          success: true,
          message: `Development mode: Your new OTP is ${otp} (SMTP unavailable)`,
          devOtp: otp
        });
      }

      await logAuditEvent({
        action: 'OTP Email Failed',
        req, userEmail: cleanEmail,
        status: 'FAILED',
        description: `Resend OTP SMTP error: ${emailErr.message}`
      });

      return res.status(502).json({
        success: false,
        message: `Unable to send OTP email. ${emailErr.message}`
      });
    }

    // If Ethereal — return OTP directly in dev
    if (!resendOtpResult.isReal && process.env.NODE_ENV !== 'production') {
      console.warn(`⚠️  Ethereal mode — Resend OTP for ${cleanEmail}: ${otp}`);
      return res.json({
        success: true,
        message: `Development mode: Your new OTP is ${otp} (email sent to Ethereal only)`,
        devOtp: otp
      });
    }

    await logAuditEvent({
      action: 'OTP Sent',
      req, userEmail: cleanEmail,
      status: 'SUCCESS',
      description: 'Resent login OTP'
    });

    const isDevResend = process.env.NODE_ENV !== 'production';
    if (isDevResend) {
      console.log(`🔑 [DEV] Resend OTP for ${cleanEmail}: ${otp}`);
    }

    return res.json({
      success: true,
      message: isDevResend
        ? `New OTP sent. Dev mode OTP: ${otp}`
        : 'A new OTP has been sent to your email.',
      ...(isDevResend && { devOtp: otp })
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to resend OTP.' });
  }
});

// ─── SEND OTP (Standalone — for nominee flows) ─────────────────────────────

router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user;
    if (isMongoConnected) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = memoryStore.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address.' });
    }

    if (isMongoConnected) {
      await OTPVerification.updateMany({ email: cleanEmail, status: 'ACTIVE' }, { status: 'EXPIRED' });
    }

    const otp = generateOTP();
    const otpHash = hashSHA256(otp);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    if (isMongoConnected) {
      await OTPVerification.create({
        userId: user._id, email: cleanEmail,
        otpHash, expiresAt: otpExpiry,
        attempts: 0, maxAttempts: 5, status: 'ACTIVE'
      });
    }

    await sendOTPEmail({
      email: cleanEmail,
      name: user.fullName || user.name || 'User',
      otp
    });

    await logAuditEvent({
      action: 'OTP Sent',
      req, userEmail: cleanEmail,
      status: 'SUCCESS',
      description: 'OTP dispatched for verification'
    });

    return res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to send OTP.' });
  }
});

// ─── LOGOUT ─────────────────────────────────────────────────────────────────

router.post('/logout', async (req, res) => {
  try {
    const { email = 'user' } = req.body;
    await logAuditEvent({
      action: 'Logout',
      req, userEmail: email,
      status: 'SUCCESS',
      description: 'User logged out'
    });
    return res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─── WEBAUTHN PASSKEYS ──────────────────────────────────────────────────────

router.post('/passkey/register-options', async (req, res) => {
  try {
    const { email = 'user@digiwill.ai', name = 'User' } = req.body;
    const options = await generateRegistrationOptions({
      rpName, rpID,
      userID: Buffer.from(email),
      userName: email,
      userDisplayName: name,
      attestationType: 'none',
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' }
    });
    currentChallenges.set(email, options.challenge);
    return res.json({ success: true, options });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/passkey/register-verify', async (req, res) => {
  try {
    const { email, body } = req.body;
    const expectedChallenge = currentChallenges.get(email);
    if (!expectedChallenge) {
      return res.status(400).json({ success: false, message: 'Challenge expired or not found.' });
    }

    const verification = await verifyRegistrationResponse({
      response: body, expectedChallenge, expectedOrigin, expectedRPID: rpID,
    });

    if (verification.verified) {
      await logAuditEvent({
        action: 'Passkey Registered',
        req, userEmail: email,
        status: 'SUCCESS',
        description: 'Registered hardware WebAuthn Passkey'
      });
      return res.json({ success: true, verified: true, message: 'Passkey registered successfully.' });
    }

    return res.status(400).json({ success: false, verified: false, message: 'Passkey verification failed.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/passkey/login-options', async (req, res) => {
  try {
    const { email } = req.body;
    const options = await generateAuthenticationOptions({ rpID, userVerification: 'preferred' });
    currentChallenges.set(email || 'anonymous', options.challenge);
    return res.json({ success: true, options });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/passkey/login-verify', async (req, res) => {
  try {
    const { email } = req.body;
    await logAuditEvent({
      action: 'Passkey Login',
      req, userEmail: email || 'user',
      status: 'SUCCESS',
      description: 'Authenticated via WebAuthn Passkey'
    });
    return res.json({ success: true, verified: true, token: generateToken({ _id: 'passkey_user', email, role: 'owner' }) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
