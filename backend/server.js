import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/authRoutes.js';
import secureRoutes from './routes/secureRoutes.js';
import vaultRoutes from './routes/vaultRoutes.js';
import { connectDB } from './config/db.js';
import User from './models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/otp', authLimiter);
app.use('/api/secure', secureRoutes);
app.use('/api/vault', vaultRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'digital-will-ai-backend' });
});

app.get('/api', (_req, res) => {
  res.json({ message: 'Digital Will AI API is running' });
});

async function seedDemoAccount() {
  const existing = await User.findOne({ email: 'owner@digitalwill.ai' });
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash('Secure123!', 10);
  await User.create({
    fullName: 'Ava Chen',
    email: 'owner@digitalwill.ai',
    passwordHash,
    role: 'owner',
    isEmailVerified: true,
    trustedDevices: ['demo-device'],
  });
}

async function startServer() {
  try {
    await connectDB();
    console.log('MongoDB connected');
    await seedDemoAccount();
  } catch (error) {
    console.warn('MongoDB unavailable, continuing without database persistence:', error.message);
  }

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

startServer();
