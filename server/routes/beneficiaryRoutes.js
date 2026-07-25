import express from 'express';
import bcrypt from 'bcryptjs';
import { Beneficiary } from '../models/Beneficiary.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { Asset } from '../models/Asset.js';
import { Document } from '../models/Document.js';
import { isMongoConnected, memoryStore } from '../config/db.js';
import { validateEmailExistence } from '../utils/emailValidator.js';
import { createInvitationToken, hashToken } from '../utils/token.js';
import { sendBeneficiaryEmail } from '../utils/mailer.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

function getClientMeta(req) {
  const ua = req.headers['user-agent'] || 'Modern Web Browser';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  let browser = 'Chrome / Modern Browser';
  if (ua.includes('Firefox')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Apple Safari';
  else if (ua.includes('Edg')) browser = 'Microsoft Edge';

  let device = 'Desktop Device';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device = 'Mobile Device';

  return { ip, browser, device, location: 'San Francisco, CA (US)' };
}

/**
 * Add Beneficiary & Validate Email Existence
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, relationship, ownerName } = req.body;

    if (!name || !email || !relationship) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and relationship are required.' 
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check duplicate beneficiary email
    let existing;
    if (isMongoConnected) {
      existing = await Beneficiary.findOne({ email: cleanEmail });
    } else {
      existing = memoryStore.beneficiaries.find(b => b.email === cleanEmail);
    }

    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'A beneficiary with this email address has already been added.' 
      });
    }

    // 2. Email Existence & Deliverability Validation
    const validationResult = await validateEmailExistence(cleanEmail);

    if (!validationResult.isValid) {
      await logAuditEvent({
        action: 'Email Validation Failed',
        req,
        details: `Validation failed for ${cleanEmail}: ${validationResult.message}`
      });

      return res.status(422).json({ 
        success: false, 
        message: validationResult.message 
      });
    }

    // 3. Generate 24-Hour Cryptographic Token
    const { rawToken, hashedToken, expiry } = createInvitationToken();
    const clientMeta = getClientMeta(req);

    const beneficiaryData = {
      ownerId: 'owner_user',
      ownerName: ownerName || 'Vault Owner',
      ownerEmail: 'owner@digiwill.ai',
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      relationship: relationship.trim(),
      status: 'Pending',
      invitationToken: hashedToken,
      tokenExpiry: expiry,
      lastInvitationSent: new Date(),
      resendCount: 0,
      ipAddress: clientMeta.ip,
      browser: clientMeta.browser,
      deviceInfo: clientMeta.device,
      location: clientMeta.location,
      activityLogs: [
        {
          action: 'Beneficiary Added',
          timestamp: new Date(),
          ipAddress: clientMeta.ip,
          device: clientMeta.device,
          details: 'Beneficiary created'
        }
      ]
    };

    let beneficiary;
    if (isMongoConnected) {
      beneficiary = await Beneficiary.create(beneficiaryData);
    } else {
      beneficiary = { _id: 'b_' + Date.now(), ...beneficiaryData };
      memoryStore.beneficiaries.push(beneficiary);
    }

    // 4. Send Email (with graceful failure in dev mode)
    const origin = process.env.ORIGIN || 'http://localhost:5173';
    const invitationUrl = `${origin}/accept-invitation/${rawToken}`;
    let emailSent = false;

    try {
      await sendBeneficiaryEmail({
        beneficiaryEmail: cleanEmail,
        beneficiaryName: name,
        ownerName: ownerName || 'Vault Owner',
        rawToken
      });
      emailSent = true;
    } catch (emailErr) {
      console.error(`❌ Beneficiary invitation email failed for ${cleanEmail}: ${emailErr.message}`);
      // In dev mode, continue without email — return the link instead
      if (process.env.NODE_ENV === 'production') {
        return res.status(502).json({
          success: false,
          message: `Beneficiary added but invitation email could not be sent. ${emailErr.message}`
        });
      }
    }

    // 5. Audit Log & Notification
    await logAuditEvent({
      action: 'Beneficiary Added',
      req,
      userEmail: cleanEmail,
      details: `Beneficiary ${name} (${cleanEmail}) added`
    });

    await logAuditEvent({
      action: 'Invitation Sent',
      req,
      userEmail: cleanEmail,
      details: emailSent
        ? `Invitation dispatched to ${cleanEmail}`
        : `Invitation email failed — link returned directly (dev mode)`
    });

    const notifObj = {
      type: 'sent',
      title: 'Beneficiary Invitation Sent',
      message: `Invitation sent to ${name} (${cleanEmail}). Token expires in 24 hours.`,
      read: false,
      createdAt: new Date()
    };

    if (isMongoConnected) {
      await Notification.create(notifObj);
    } else {
      memoryStore.notifications.unshift(notifObj);
    }

    const isDev = process.env.NODE_ENV !== 'production';
    const responseMsg = emailSent
      ? 'Invitation sent successfully. A secure verification email has been sent to the nominee\'s email address.'
      : `Invitation created. Email delivery failed — share this link with the nominee directly.`;

    return res.status(201).json({
      success: true,
      message: responseMsg,
      ...(isDev && { invitationUrl }),
      emailSent
    });
  } catch (error) {
    console.error('Add Beneficiary Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to add beneficiary. Please try again.' 
    });
  }
});

/**
 * Get All Beneficiaries for Owner
 */
router.get('/', async (req, res) => {
  try {
    let beneficiaries;
    if (isMongoConnected) {
      beneficiaries = await Beneficiary.find().sort({ createdAt: -1 });
    } else {
      beneficiaries = [...memoryStore.beneficiaries];
    }

    const now = new Date();
    for (let b of beneficiaries) {
      if (b.status === 'Pending' && b.tokenExpiry && new Date(b.tokenExpiry) < now) {
        b.status = 'Expired';
        if (isMongoConnected) {
          await Beneficiary.findByIdAndUpdate(b._id, { status: 'Expired' });
        }
        await logAuditEvent({
          action: 'Invitation Expired',
          req,
          userEmail: b.email,
          details: `Invitation token expired for ${b.name}`
        });
      }
    }

    return res.json({ success: true, beneficiaries });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Get Invitation Details via Raw Token
 */
router.get('/invitation/:rawToken', async (req, res) => {
  try {
    const { rawToken } = req.params;
    const hashed = hashToken(rawToken);

    let beneficiary;
    if (isMongoConnected) {
      beneficiary = await Beneficiary.findOne({ invitationToken: hashed });
    } else {
      beneficiary = memoryStore.beneficiaries.find(b => b.invitationToken === hashed);
    }

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Invalid or already used invitation token.' });
    }

    const isExpired = new Date(beneficiary.tokenExpiry) < new Date();

    if (isExpired && beneficiary.status === 'Pending') {
      beneficiary.status = 'Expired';
      if (isMongoConnected) {
        await Beneficiary.findByIdAndUpdate(beneficiary._id, { status: 'Expired' });
      }
    }

    return res.json({
      success: true,
      beneficiary: {
        _id: beneficiary._id,
        ownerName: beneficiary.ownerName,
        name: beneficiary.name,
        email: beneficiary.email,
        relationship: beneficiary.relationship,
        status: beneficiary.status,
        tokenExpiry: beneficiary.tokenExpiry,
        isExpired
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Beneficiary Accepts Invitation
 */
router.post('/accept', async (req, res) => {
  try {
    const { rawToken } = req.body;
    if (!rawToken) return res.status(400).json({ success: false, message: 'Token is required.' });

    const hashed = hashToken(rawToken);
    const clientMeta = getClientMeta(req);

    let beneficiary;
    if (isMongoConnected) {
      beneficiary = await Beneficiary.findOne({ invitationToken: hashed });
    } else {
      beneficiary = memoryStore.beneficiaries.find(b => b.invitationToken === hashed);
    }

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Invitation link is invalid or already used.' });
    }

    if (new Date(beneficiary.tokenExpiry) < new Date()) {
      return res.status(410).json({ success: false, message: 'Invitation link has expired.' });
    }

    const updateData = {
      status: 'Accepted',
      acceptedAt: new Date(),
      verifiedAt: new Date(),
      invitationToken: null,
      ipAddress: clientMeta.ip,
      browser: clientMeta.browser,
      deviceInfo: clientMeta.device,
      location: clientMeta.location
    };

    if (isMongoConnected) {
      await Beneficiary.findByIdAndUpdate(beneficiary._id, {
        ...updateData,
        $push: {
          activityLogs: {
            action: 'Invitation Accepted',
            timestamp: new Date(),
            ipAddress: clientMeta.ip,
            device: clientMeta.device,
            details: 'Accepted terms'
          }
        }
      });
    } else {
      Object.assign(beneficiary, updateData);
    }

    await logAuditEvent({
      action: 'Invitation Accepted',
      req,
      userEmail: beneficiary.email,
      details: `${beneficiary.name} accepted beneficiary nomination`
    });

    await logAuditEvent({
      action: 'Beneficiary Verified',
      req,
      userEmail: beneficiary.email,
      details: `Beneficiary account verified`
    });

    const notifObj = {
      type: 'accepted',
      title: 'Invitation Accepted',
      message: `${beneficiary.name} (${beneficiary.email}) has accepted the nomination.`,
      read: false,
      createdAt: new Date()
    };

    if (isMongoConnected) {
      await Notification.create(notifObj);
    } else {
      memoryStore.notifications.unshift(notifObj);
    }

    return res.json({
      success: true,
      message: 'Invitation accepted successfully.',
      status: 'Accepted'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Beneficiary Declines Invitation
 */
router.post('/decline', async (req, res) => {
  try {
    const { rawToken } = req.body;
    if (!rawToken) return res.status(400).json({ success: false, message: 'Token is required.' });

    const hashed = hashToken(rawToken);

    let beneficiary;
    if (isMongoConnected) {
      beneficiary = await Beneficiary.findOne({ invitationToken: hashed });
    } else {
      beneficiary = memoryStore.beneficiaries.find(b => b.invitationToken === hashed);
    }

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Invitation link invalid or already used.' });
    }

    const updateData = {
      status: 'Declined',
      invitationToken: null
    };

    if (isMongoConnected) {
      await Beneficiary.findByIdAndUpdate(beneficiary._id, updateData);
    } else {
      Object.assign(beneficiary, updateData);
    }

    await logAuditEvent({
      action: 'Invitation Declined',
      req,
      userEmail: beneficiary.email,
      details: `${beneficiary.name} declined beneficiary nomination`
    });

    const notifObj = {
      type: 'declined',
      title: 'Invitation Declined',
      message: `${beneficiary.name} (${beneficiary.email}) declined the invitation.`,
      read: false,
      createdAt: new Date()
    };

    if (isMongoConnected) {
      await Notification.create(notifObj);
    } else {
      memoryStore.notifications.unshift(notifObj);
    }

    return res.json({ success: true, message: 'Invitation declined.', status: 'Declined' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Owner Resends Invitation
 */
router.post('/resend/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let beneficiary;
    if (isMongoConnected) {
      beneficiary = await Beneficiary.findById(id);
    } else {
      beneficiary = memoryStore.beneficiaries.find(b => b._id === id);
    }

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary record not found.' });
    }

    const { rawToken, hashedToken, expiry } = createInvitationToken();

    const updateData = {
      status: 'Pending',
      invitationToken: hashedToken,
      tokenExpiry: expiry,
      lastInvitationSent: new Date(),
      resendCount: (beneficiary.resendCount || 0) + 1
    };

    if (isMongoConnected) {
      await Beneficiary.findByIdAndUpdate(id, updateData);
    } else {
      Object.assign(beneficiary, updateData);
    }

    let resendEmailSent = false;
    try {
      await sendBeneficiaryEmail({
        beneficiaryEmail: beneficiary.email,
        beneficiaryName: beneficiary.name,
        ownerName: beneficiary.ownerName || 'Vault Owner',
        rawToken
      });
      resendEmailSent = true;
    } catch (emailErr) {
      console.error(`❌ Resend invitation email failed for ${beneficiary.email}: ${emailErr.message}`);
      if (process.env.NODE_ENV === 'production') {
        return res.status(502).json({
          success: false,
          message: `Unable to resend invitation email. ${emailErr.message}`
        });
      }
    }

    const resendOrigin = process.env.ORIGIN || 'http://localhost:5173';
    const resendInvitationUrl = `${resendOrigin}/accept-invitation/${rawToken}`;

    await logAuditEvent({
      action: 'Invitation Resent',
      req,
      userEmail: beneficiary.email,
      details: `Resent invitation to ${beneficiary.name} (${beneficiary.email})`
    });

    const notifObj = {
      type: 'resent',
      title: 'Invitation Resent',
      message: `Fresh invitation link sent to ${beneficiary.name}.`,
      read: false,
      createdAt: new Date()
    };

    if (isMongoConnected) {
      await Notification.create(notifObj);
    } else {
      memoryStore.notifications.unshift(notifObj);
    }

    const isDevResend = process.env.NODE_ENV !== 'production';
    const resendMsg = resendEmailSent
      ? 'Invitation resent successfully.'
      : 'Invitation recreated. Email delivery failed — share this link with the nominee directly.';

    return res.json({
      success: true,
      message: resendMsg,
      ...(isDevResend && { invitationUrl: resendInvitationUrl }),
      rawToken,
      emailSent: resendEmailSent
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /add - Alias for adding nominee
 */
router.post('/add', async (req, res) => {
  req.url = '/';
  return router.handle(req, res);
});

/**
 * Nominee Registration Endpoint
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, rawToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email address and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let beneficiary;
    if (rawToken) {
      const hashed = hashToken(rawToken);
      if (isMongoConnected) {
        beneficiary = await Beneficiary.findOne({ invitationToken: hashed });
      } else {
        beneficiary = (memoryStore.beneficiaries || []).find(b => b.invitationToken === hashed);
      }
    }

    if (!beneficiary) {
      if (isMongoConnected) {
        beneficiary = await Beneficiary.findOne({ email: cleanEmail });
      } else {
        beneficiary = (memoryStore.beneficiaries || []).find(b => b.email === cleanEmail);
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    if (isMongoConnected) {
      user = await User.findOne({ email: cleanEmail });
      if (user) {
        user.password = hashedPassword;
        user.isVerified = true;
        user.role = 'beneficiary';
        user.updatedAt = new Date();
        await user.save();
      } else {
        user = await User.create({
          fullName: beneficiary ? beneficiary.name : 'Nominee User',
          email: cleanEmail,
          phone: beneficiary ? beneficiary.phone : '',
          password: hashedPassword,
          isVerified: true,
          role: 'beneficiary',
          hasPasskey: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      if (beneficiary) {
        beneficiary.status = 'Accepted';
        beneficiary.acceptedAt = new Date();
        await beneficiary.save();
      }
    } else {
      user = (memoryStore.users || []).find(u => u.email === cleanEmail);
      if (user) {
        user.password = hashedPassword;
        user.isVerified = true;
        user.role = 'beneficiary';
      } else {
        user = {
          _id: 'u_' + Date.now(),
          fullName: beneficiary ? beneficiary.name : 'Nominee User',
          email: cleanEmail,
          phone: beneficiary ? beneficiary.phone : '',
          password: hashedPassword,
          isVerified: true,
          role: 'beneficiary',
          createdAt: new Date()
        };
        memoryStore.users = memoryStore.users || [];
        memoryStore.users.push(user);
      }
      if (beneficiary) beneficiary.status = 'Accepted';
    }

    await logAuditEvent({
      action: 'Nominee Registered',
      req,
      userEmail: cleanEmail,
      role: 'beneficiary',
      status: 'SUCCESS',
      description: 'Nominee set account password successfully'
    });

    const notifObj = {
      type: 'registered',
      title: 'Nominee Account Created',
      message: `${beneficiary ? beneficiary.name : cleanEmail} has registered as a Nominee.`,
      read: false,
      createdAt: new Date()
    };

    if (isMongoConnected) {
      await Notification.create(notifObj);
    } else {
      memoryStore.notifications = memoryStore.notifications || [];
      memoryStore.notifications.unshift(notifObj);
    }

    return res.status(201).json({
      success: true,
      message: 'Nominee password set successfully. Redirecting to login page...'
    });
  } catch (error) {
    console.error('Nominee Registration Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to process nominee registration.' });
  }
});

/**
 * GET /dashboard - Nominee Dashboard Endpoint
 */
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const cleanEmail = (req.user.email || '').trim().toLowerCase();

    let beneficiary;
    if (isMongoConnected) {
      beneficiary = await Beneficiary.findOne({ email: cleanEmail });
    } else {
      beneficiary = (memoryStore.beneficiaries || []).find(b => b.email === cleanEmail);
    }

    let assignedAssets = [];
    if (isMongoConnected) {
      assignedAssets = await Asset.find({
        $or: [
          { nomineeEmail: cleanEmail },
          { assignedBeneficiary: cleanEmail },
          { assignedBeneficiary: beneficiary ? beneficiary.name : cleanEmail }
        ]
      }).sort({ createdAt: -1 });
    } else {
      assignedAssets = (memoryStore.assets || []).filter(
        a => (a.nomineeEmail && a.nomineeEmail.toLowerCase() === cleanEmail) ||
             a.assignedBeneficiary === cleanEmail || 
             (beneficiary && a.assignedBeneficiary === beneficiary.name)
      );
    }

    let assignedDocuments = [];
    if (isMongoConnected) {
      assignedDocuments = await Document.find({
        $or: [
          { allowedNominees: cleanEmail },
          { assignedTo: cleanEmail },
          { assignedTo: beneficiary ? beneficiary.name : cleanEmail }
        ]
      }).sort({ uploadDate: -1 });
    } else {
      assignedDocuments = (memoryStore.documents || []).filter(
        d => (d.allowedNominees && d.allowedNominees.includes(cleanEmail)) ||
             d.assignedTo === cleanEmail || 
             (beneficiary && d.assignedTo === beneficiary.name)
      );
    }

    return res.json({
      success: true,
      nominee: {
        name: beneficiary ? beneficiary.name : req.user.fullName || 'Nominee',
        email: cleanEmail,
        phone: beneficiary ? beneficiary.phone : req.user.phone || '',
        relationship: beneficiary ? beneficiary.relationship : 'Designated Nominee',
        ownerName: beneficiary ? beneficiary.ownerName : 'Vault Owner',
        status: beneficiary ? beneficiary.status : 'Accepted'
      },
      assignedAssets,
      assignedDocuments,
      releaseStatus: {
        isReleased: false,
        message: 'Access Restricted: Estate Vault Owner is active. Digital Will and confidential asset release instructions remain sealed until release conditions are satisfied.'
      }
    });
  } catch (error) {
    console.error('Nominee Dashboard Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/beneficiaries/:id - Delete Beneficiary (Module 2 & 4)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let beneficiary;
    if (isMongoConnected) {
      beneficiary = await Beneficiary.findById(id);
      if (beneficiary) {
        await Beneficiary.findByIdAndDelete(id);
      }
    } else {
      beneficiary = (memoryStore.beneficiaries || []).find(b => b._id === id);
      memoryStore.beneficiaries = (memoryStore.beneficiaries || []).filter(b => b._id !== id);
    }

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary record not found.' });
    }

    await logAuditEvent({
      action: 'Beneficiary Deleted',
      req,
      userEmail: beneficiary.email,
      details: `Removed beneficiary ${beneficiary.name} (${beneficiary.email})`
    });

    const notifObj = {
      type: 'deleted',
      title: 'Beneficiary Removed',
      message: `Beneficiary ${beneficiary.name} (${beneficiary.email}) was removed from the vault.`,
      read: false,
      createdAt: new Date()
    };

    if (isMongoConnected) {
      await Notification.create(notifObj);
    } else {
      memoryStore.notifications = memoryStore.notifications || [];
      memoryStore.notifications.unshift(notifObj);
    }

    return res.json({
      success: true,
      message: `Beneficiary ${beneficiary.name} deleted successfully.`
    });
  } catch (error) {
    console.error('Delete Beneficiary Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete beneficiary.' });
  }
});

/**
 * PUT /api/beneficiaries/:id - Update Beneficiary (Module 2)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, relationship } = req.body;

    let beneficiary;
    if (isMongoConnected) {
      beneficiary = await Beneficiary.findByIdAndUpdate(
        id,
        { name, email: email ? email.trim().toLowerCase() : undefined, phone, relationship, updatedAt: new Date() },
        { new: true }
      );
    } else {
      beneficiary = (memoryStore.beneficiaries || []).find(b => b._id === id);
      if (beneficiary) {
        if (name) beneficiary.name = name;
        if (email) beneficiary.email = email.trim().toLowerCase();
        if (phone) beneficiary.phone = phone;
        if (relationship) beneficiary.relationship = relationship;
      }
    }

    if (!beneficiary) {
      return res.status(404).json({ success: false, message: 'Beneficiary record not found.' });
    }

    await logAuditEvent({
      action: 'Beneficiary Updated',
      req,
      userEmail: beneficiary.email,
      details: `Updated details for ${beneficiary.name}`
    });

    return res.json({
      success: true,
      message: 'Beneficiary details updated successfully.',
      beneficiary
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
