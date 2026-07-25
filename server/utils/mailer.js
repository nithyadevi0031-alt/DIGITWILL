import nodemailer from 'nodemailer';

let transporter;
let transporterType = 'none'; // 'gmail' | 'smtp' | 'ethereal' | 'none'

/**
 * Initialize SMTP transporter from environment variables.
 * Priority: Real SMTP credentials > Ethereal (dev-only fallback)
 * Ethereal emails are NOT delivered — they only exist at ethereal.email preview URLs.
 */
async function getTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT) || 587;

  // ── Real SMTP (Gmail / Outlook / Custom) ──
  if (smtpHost && smtpUser && smtpPass && smtpPass !== 'your-16-char-app-password') {
    const isGmail = smtpHost.includes('gmail');
    const isPort465 = smtpPort === 465;

    const realTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isPort465, // true for 465, false for 587
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    // Verify SMTP connection on startup
    try {
      await realTransporter.verify();
      transporter = realTransporter;
      transporterType = isGmail ? 'gmail' : 'smtp';
      console.log(`✅ SMTP connected successfully via ${smtpHost}:${smtpPort} (${transporterType})`);
    } catch (verifyErr) {
      console.error(`❌ SMTP connection FAILED: ${verifyErr.message}`);
      console.error('   → Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env');
      if (isGmail) {
        console.error('   → For Gmail: Use App Password (not your normal password)');
        console.error('   → Enable 2FA → https://myaccount.google.com/apppasswords');
      }
      console.warn('');
      console.warn('⚠️  SMTP auth failed — falling back to Ethereal (test-only).');
      console.warn('⚠️  Emails will NOT be delivered to real inboxes.');
      console.warn('⚠️  The app will still work — verification links will be logged to console.');
      console.warn('');

      // Fall back to Ethereal so the app remains functional
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        transporterType = 'ethereal';
        console.log('✉️  Ethereal fallback initialized:', testAccount.user);
      } catch (ethErr) {
        console.error('❌ Ethereal fallback also failed:', ethErr.message);
        transporterType = 'none';
        transporter = null;
      }
    }
  } else {
    // ── Ethereal Fallback (Development Only) ──
    console.warn('');
    console.warn('⚠️  ═══════════════════════════════════════════════════════════════');
    console.warn('⚠️  NO REAL SMTP CREDENTIALS CONFIGURED');
    console.warn('⚠️  Emails will NOT be delivered to real inboxes.');
    console.warn('⚠️  Using Ethereal (test-only). Preview at the logged URL only.');
    console.warn('⚠️');
    console.warn('⚠️  To fix: Add Gmail App Password to server/.env:');
    console.warn('⚠️    SMTP_HOST=smtp.gmail.com');
    console.warn('⚠️    SMTP_PORT=587');
    console.warn('⚠️    SMTP_USER=your-gmail@gmail.com');
    console.warn('⚠️    SMTP_PASS=your-16-char-app-password');
    console.warn('⚠️  ═══════════════════════════════════════════════════════════════');
    console.warn('');

    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      transporterType = 'ethereal';
      console.log('✉️  Ethereal Test SMTP initialized:', testAccount.user);
    } catch (err) {
      console.error('❌ Ethereal initialization failed:', err.message);
      transporterType = 'none';
      transporter = null;
    }
  }

  return transporter;
}

/**
 * Get current transporter type for status checks
 */
export function getMailerStatus() {
  return {
    type: transporterType,
    isReal: transporterType === 'gmail' || transporterType === 'smtp',
    isEthereal: transporterType === 'ethereal',
    isNone: transporterType === 'none'
  };
}

/**
 * Core email sending function with full SMTP response validation.
 * Throws on failure — caller must handle errors.
 */
async function sendEmail({ to, subject, html }) {
  const mailTransporter = await getTransporter();

  if (!mailTransporter) {
    throw new Error('Email service is not configured. No SMTP credentials found in .env');
  }

  const from = process.env.SMTP_FROM || `"Digital Will AI" <${process.env.SMTP_USER || 'no-reply@digiwill.ai'}>`;

  try {
    const info = await mailTransporter.sendMail({ from, to, subject, html });

    // Log SMTP response
    const previewUrl = nodemailer.getTestMessageUrl(info);

    if (transporterType === 'ethereal' && previewUrl) {
      console.log(`✉️  [Ethereal Preview] ${to}: ${previewUrl}`);
      console.warn(`⚠️  Email NOT delivered to real inbox — Ethereal test only`);
    } else {
      console.log(`✅ Email sent → ${to} | MessageID: ${info.messageId} | Response: ${info.response || 'accepted'}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      isReal: transporterType === 'gmail' || transporterType === 'smtp',
      isEthereal: transporterType === 'ethereal',
      previewUrl: previewUrl || null
    };
  } catch (sendErr) {
    // Log detailed SMTP error
    console.error(`❌ Email FAILED → ${to}`);
    console.error(`   SMTP Error: ${sendErr.message}`);
    console.error(`   Code: ${sendErr.code || 'unknown'}`);
    console.error(`   Command: ${sendErr.command || 'unknown'}`);

    if (sendErr.responseCode === 535) {
      throw new Error('SMTP authentication failed. Check your email credentials or App Password in .env');
    } else if (sendErr.code === 'ECONNREFUSED') {
      throw new Error('SMTP connection refused. Check SMTP_HOST and SMTP_PORT in .env');
    } else if (sendErr.code === 'ESOCKET' || sendErr.code === 'ETIMEDOUT') {
      throw new Error('SMTP connection timed out. Check your network and SMTP settings.');
    } else if (sendErr.code === 'EAUTH') {
      throw new Error('SMTP authentication error. For Gmail, use an App Password (not your normal password).');
    } else {
      throw new Error(`Email delivery failed: ${sendErr.message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC EMAIL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send User Account Verification Email
 */
export async function sendVerificationEmail({ email, name, rawToken }) {
  const verifyUrl = `${process.env.ORIGIN || 'http://localhost:5173'}/verify-email/${rawToken}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="background-color: #221B2A; color: #FFFFFF; font-family: sans-serif; padding: 30px;">
    <div style="max-width: 550px; margin: 0 auto; background: #2B103D; padding: 30px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.1);">
      <h2 style="color: #D2C8BC; margin-top: 0;">Verify Your Digital Will AI Account</h2>
      <p style="color: #FFFFFF; font-size: 15px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #D2C8BC; font-size: 14px; line-height: 1.6;">
        Thank you for registering with <strong>Digital Will AI</strong>. To activate your account, please verify your email address by clicking the button below.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #731BB8 0%, #9A2CF2 100%); color: #FFFFFF; text-decoration: none; font-weight: bold; border-radius: 12px;">
          Verify Email Address
        </a>
      </div>
      <p style="color: #8D89AF; font-size: 12px;">
        Or copy this link: <br/>
        <a href="${verifyUrl}" style="color: #9A2CF2; word-break: break-all;">${verifyUrl}</a>
      </p>
      <p style="color: #8D89AF; font-size: 12px; margin-bottom: 0;">
        This verification link expires in <strong>24 hours</strong>. If you did not create this account, you can safely ignore this email.
      </p>
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;" />
      <p style="color: #8D89AF; font-size: 11px; text-align: center; margin: 0;">
        Regards,<br/>Digital Will AI Team
      </p>
    </div>
  </body>
  </html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Verify Your Digital Will AI Account',
    html: htmlContent
  });
}

/**
 * Send OTP Email for Login 2FA
 */
export async function sendOTPEmail({ email, name, otp }) {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="background-color: #221B2A; color: #FFFFFF; font-family: sans-serif; padding: 30px;">
    <div style="max-width: 550px; margin: 0 auto; background: #2B103D; padding: 30px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.1);">
      <h2 style="color: #D2C8BC; margin-top: 0;">Digital Will AI Login Verification</h2>
      <p style="color: #FFFFFF; font-size: 15px;">Hello <strong>${name}</strong>,</p>
      <p style="color: #D2C8BC; font-size: 14px; line-height: 1.6;">
        Your One-Time Password (OTP) is:
      </p>
      <div style="text-align: center; margin: 25px 0;">
        <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #731BB8 0%, #9A2CF2 100%); border-radius: 16px; letter-spacing: 12px; font-size: 36px; font-weight: 900; color: #FFFFFF; font-family: 'Courier New', monospace;">
          ${otp}
        </div>
      </div>
      <p style="color: #D2C8BC; font-size: 14px; line-height: 1.6;">
        This OTP expires in <strong>5 minutes</strong>.
      </p>
      <div style="background: rgba(217, 95, 48, 0.15); border: 1px solid rgba(217, 95, 48, 0.3); border-radius: 12px; padding: 15px; margin: 20px 0;">
        <p style="color: #D95F30; font-size: 12px; margin: 0; font-weight: bold;">⚠ Security Notice</p>
        <p style="color: #D2C8BC; font-size: 12px; margin: 5px 0 0 0;">
          Do not share this OTP with anyone. Digital Will AI team will never ask for your OTP.
        </p>
      </div>
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;" />
      <p style="color: #8D89AF; font-size: 11px; text-align: center; margin: 0;">Digital Will AI Team</p>
    </div>
  </body>
  </html>
  `;

  return await sendEmail({
    to: email,
    subject: 'Digital Will AI Login Verification — OTP',
    html: htmlContent
  });
}

/**
 * Send Nominee Invitation Email
 */
export async function sendBeneficiaryEmail({ beneficiaryEmail, beneficiaryName, ownerName, rawToken }) {
  const acceptUrl = `${process.env.ORIGIN || 'http://localhost:5173'}/accept-invitation/${rawToken}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="background-color: #221B2A; color: #FFFFFF; font-family: sans-serif; padding: 30px;">
    <div style="max-width: 550px; margin: 0 auto; background: #2B103D; padding: 30px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.1);">
      <h2 style="color: #D2C8BC; margin-top: 0;">Digital Will Beneficiary Nomination</h2>
      <p style="color: #FFFFFF; font-size: 15px;">Hello <strong>${beneficiaryName}</strong>,</p>
      <p style="color: #D2C8BC; font-size: 14px; line-height: 1.6;">
        You have been nominated as a beneficiary in a Digital Will by <strong>${ownerName}</strong>.
      </p>
      <p style="color: #D2C8BC; font-size: 14px; line-height: 1.6;">
        Please click the secure link below to verify your identity and accept the invitation.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${acceptUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #731BB8 0%, #9A2CF2 100%); color: #FFFFFF; text-decoration: none; font-weight: bold; border-radius: 12px;">
          Accept Invitation
        </a>
      </div>
      <p style="color: #8D89AF; font-size: 12px; margin-bottom: 0;">
        This invitation expires in <strong>24 hours</strong>.
      </p>
      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 25px 0;" />
      <p style="color: #8D89AF; font-size: 11px; text-align: center; margin: 0;">Digital Will AI Security Protocol</p>
    </div>
  </body>
  </html>
  `;

  return await sendEmail({
    to: beneficiaryEmail,
    subject: `Beneficiary Nomination Invitation from ${ownerName} - Digital Will AI`,
    html: htmlContent
  });
}

export const sendBeneficiaryInvitationEmail = sendBeneficiaryEmail;

/**
 * Send a test email to verify SMTP configuration
 */
export async function sendTestEmail(recipientEmail) {
  return await sendEmail({
    to: recipientEmail,
    subject: 'Digital Will AI — SMTP Test Email',
    html: `
    <div style="background: #2B103D; color: white; padding: 30px; border-radius: 18px; font-family: sans-serif; max-width: 500px; margin: auto;">
      <h2 style="color: #D2C8BC;">✅ SMTP Configuration Working</h2>
      <p>This test email confirms your SMTP settings are correctly configured.</p>
      <p style="color: #8D89AF; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
      <p style="color: #8D89AF; font-size: 12px;">Transporter: ${transporterType}</p>
    </div>`
  });
}
