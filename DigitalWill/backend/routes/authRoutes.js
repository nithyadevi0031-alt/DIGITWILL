import express from 'express';
import { deleteAccountController, forgotPasswordController, loginController, logoutAllController, logoutSessionController, profileController, registerController, requestEmailVerificationController, requestOtpController, resetPasswordController, sessionsController, verifyEmailController, verifyOtpController } from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.get('/profile', requireAuth, requireRole(['owner', 'nominee', 'admin']), profileController);
router.post('/verify-email', requireAuth, verifyEmailController);
router.post('/request-email-verification', requireAuth, requestEmailVerificationController);
router.post('/request-otp', requireAuth, requestOtpController);
router.post('/verify-otp', requireAuth, verifyOtpController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);
router.get('/sessions', requireAuth, sessionsController);
router.post('/logout-all', requireAuth, logoutAllController);
router.post('/logout-session', requireAuth, logoutSessionController);
router.delete('/account', requireAuth, deleteAccountController);

export default router;
