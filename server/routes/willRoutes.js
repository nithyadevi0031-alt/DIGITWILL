import express from 'express';
import { Will } from '../models/Will.js';
import { Beneficiary } from '../models/Beneficiary.js';
import { isMongoConnected, memoryStore } from '../config/db.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { requireAuth, requireOwner } from '../middleware/auth.js';
import { sendBeneficiaryInvitationEmail } from '../utils/mailer.js';
import crypto from 'crypto';

const router = express.Router();

/**
 * POST /api/wills & POST /api/wills/create - Create Will (Owner Only - Module 6, 8, 10, 13)
 */
const createWillHandler = async (req, res) => {
  try {
    const { willTitle, fullName, dob, address, executorName, specialInstructions, beneficiaries } = req.body;

    if (!willTitle || !fullName || !dob || !address || !executorName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Will Title, Full Name, DOB, Address, and Executor Name are required.' 
      });
    }

    // Validate email format for each beneficiary if provided
    let parsedBeneficiaries = [];
    if (beneficiaries && Array.isArray(beneficiaries)) {
      for (const b of beneficiaries) {
        if (!b.beneficiaryEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.beneficiaryEmail.trim())) {
          return res.status(400).json({
            success: false,
            message: `Valid Email Address is required for nominee "${b.name || 'Beneficiary'}".`
          });
        }

        parsedBeneficiaries.push({
          name: (b.name || '').trim(),
          beneficiaryEmail: b.beneficiaryEmail.trim().toLowerCase(),
          phone: (b.phone || '').trim(),
          relationship: (b.relationship || 'Designated Nominee').trim(),
          assignedAssets: Array.isArray(b.assignedAssets) ? b.assignedAssets : (b.assignedAssets ? [b.assignedAssets] : []),
          percentage: (b.percentage || '100%').trim(),
          notes: (b.notes || '').trim(),
          releaseConditions: (b.releaseConditions || 'Death certificate or emergency release verification').trim(),
          status: 'Assigned'
        });
      }
    }

    const ownerId = req.user.id || req.user._id || 'owner_user';

    const willData = {
      ownerId,
      willTitle: willTitle.trim(),
      fullName: fullName.trim(),
      dob: dob.trim(),
      address: address.trim(),
      executorName: executorName.trim(),
      specialInstructions: specialInstructions ? specialInstructions.trim() : '',
      beneficiaries: parsedBeneficiaries,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let will;
    if (isMongoConnected) {
      will = await Will.create(willData);
    } else {
      will = { _id: 'will_' + Date.now(), ...willData };
      memoryStore.wills = memoryStore.wills || [];
      memoryStore.wills.push(will);
    }

    // Send Invitation Emails for newly added nominees (Module 8 Requirement)
    for (const b of parsedBeneficiaries) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const bRecordData = {
        ownerId,
        ownerName: fullName,
        name: b.name,
        email: b.beneficiaryEmail,
        phone: b.phone,
        relationship: b.relationship,
        status: 'Pending',
        invitationToken: rawToken,
        tokenExpiry
      };

      if (isMongoConnected) {
        await Beneficiary.findOneAndUpdate({ email: b.beneficiaryEmail }, bRecordData, { upsert: true });
      } else {
        memoryStore.beneficiaries = memoryStore.beneficiaries || [];
        const idx = memoryStore.beneficiaries.findIndex(ben => ben.email === b.beneficiaryEmail);
        if (idx >= 0) memoryStore.beneficiaries[idx] = { _id: memoryStore.beneficiaries[idx]._id, ...bRecordData };
        else memoryStore.beneficiaries.push({ _id: 'ben_' + Date.now(), ...bRecordData });
      }

      await sendBeneficiaryInvitationEmail({
        recipientEmail: b.beneficiaryEmail,
        beneficiaryName: b.name,
        ownerName: fullName,
        rawToken
      });
    }

    await logAuditEvent({
      action: 'Will Created',
      req,
      userEmail: req.user.email || 'owner@digiwill.ai',
      role: req.user.role || 'owner',
      status: 'SUCCESS',
      description: `Digital Will "${willTitle}" created with ${parsedBeneficiaries.length} assigned nominees`
    });

    return res.status(201).json({
      success: true,
      message: 'Will created successfully and nominee invitations dispatched.',
      will
    });
  } catch (error) {
    console.error('Create Will Error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create Will. Please try again.' });
  }
};

router.post('/', requireAuth, requireOwner, createWillHandler);
router.post('/create', requireAuth, requireOwner, createWillHandler);

/**
 * GET /api/wills - List owner's Wills
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const ownerId = req.user.id || req.user._id || 'owner_user';
    let wills;

    if (isMongoConnected) {
      wills = await Will.find({ ownerId }).sort({ createdAt: -1 });
    } else {
      wills = (memoryStore.wills || []).filter(w => w.ownerId === ownerId);
    }

    return res.json({ success: true, wills });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/wills/:id - Get specific Will
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    let will;

    if (isMongoConnected) {
      will = await Will.findById(id);
    } else {
      will = (memoryStore.wills || []).find(w => w._id === id);
    }

    if (!will) {
      return res.status(404).json({ success: false, message: 'Will not found.' });
    }

    return res.json({ success: true, will });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * PUT /api/wills/:id - Update Will (Owner Only - Module 10)
 */
router.put('/:id', requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const updatePayload = { ...req.body, updatedAt: new Date() };

    let will;
    if (isMongoConnected) {
      will = await Will.findByIdAndUpdate(id, updatePayload, { new: true });
    } else {
      will = (memoryStore.wills || []).find(w => w._id === id);
      if (will) Object.assign(will, updatePayload);
    }

    if (!will) {
      return res.status(404).json({ success: false, message: 'Will not found.' });
    }

    await logAuditEvent({
      action: 'Will Updated',
      req,
      userEmail: req.user.email || 'owner@digiwill.ai',
      role: req.user.role || 'owner',
      status: 'SUCCESS',
      description: `Digital Will "${will.willTitle}" updated`
    });

    return res.json({ success: true, message: 'Will updated successfully.', will });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/wills/:id - Delete Will (Owner Only - Module 10)
 */
router.delete('/:id', requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      await Will.findByIdAndDelete(id);
    } else {
      memoryStore.wills = (memoryStore.wills || []).filter(w => w._id !== id);
    }

    await logAuditEvent({
      action: 'Will Deleted',
      req,
      userEmail: req.user.email || 'owner@digiwill.ai',
      role: req.user.role || 'owner',
      status: 'SUCCESS',
      description: `Digital Will deleted`
    });

    return res.json({ success: true, message: 'Will deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
