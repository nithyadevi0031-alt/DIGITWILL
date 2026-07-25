import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import { sendTestEmail, getMailerStatus } from './utils/mailer.js';

import authRoutes from './routes/authRoutes.js';
import beneficiaryRoutes from './routes/beneficiaryRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import willRoutes from './routes/willRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Database
connectDB();

// Security Middlewares
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000, // Increased limit to prevent 429 Too Many Requests errors during active sessions
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use(limiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/beneficiaries', beneficiaryRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/wills', willRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/pdf', pdfRoutes);

// Route Aliases
app.use('/auth', authRoutes);
app.use('/nominee', beneficiaryRoutes);
app.use('/otp', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, service: 'Digital Will AI Server', timestamp: new Date() });
});

/**
 * GET /api/debug/smtp-status — Check SMTP configuration status
 */
app.get('/api/debug/smtp-status', (req, res) => {
  const status = getMailerStatus();
  res.json({
    success: true,
    smtp: {
      type: status.type,
      isReal: status.isReal,
      isEthereal: status.isEthereal,
      host: process.env.SMTP_HOST || 'not configured',
      port: process.env.SMTP_PORT || 'not configured',
      user: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'not configured',
      warning: status.isEthereal ? 'Ethereal is a TEST service. Emails are NOT delivered to real inboxes.' : null
    }
  });
});

/**
 * POST /api/debug/send-test-email — Send a test email to verify SMTP
 */
app.post('/api/debug/send-test-email', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const result = await sendTestEmail(email);
    
    return res.json({
      success: true,
      message: result.isReal 
        ? `✅ Test email sent successfully to ${email}` 
        : `⚠️ Email sent via Ethereal (test-only). NOT delivered to real inbox.`,
      details: {
        messageId: result.messageId,
        response: result.response,
        transporterType: result.isReal ? 'Real SMTP' : 'Ethereal (test)',
        previewUrl: result.previewUrl,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
      smtpError: true,
      hint: 'Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in server/.env'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Digital Will AI Backend running on http://localhost:${PORT}`);
});
