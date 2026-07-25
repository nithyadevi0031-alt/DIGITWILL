import express from 'express';
import { Beneficiary } from '../models/Beneficiary.js';
import { User } from '../models/User.js';
import { isMongoConnected, memoryStore } from '../config/db.js';

const router = express.Router();

/**
 * Evaluate Emergency Access Rules
 */
router.get('/status/:beneficiaryId', async (req, res) => {
  try {
    const { beneficiaryId } = req.params;

    let beneficiary;
    if (isMongoConnected) {
      beneficiary = await Beneficiary.findById(beneficiaryId);
    } else {
      beneficiary = memoryStore.beneficiaries.find(b => b._id === beneficiaryId);
    }

    if (!beneficiary) {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }

    let user;
    if (isMongoConnected) {
      user = await User.findOne({ email: beneficiary.email });
    } else {
      user = memoryStore.users.find(u => u.email === beneficiary.email);
    }

    // Evaluate 8 strict conditions
    const rules = {
      acceptedInvitation: beneficiary.status === 'Accepted' || beneficiary.status === 'Verified',
      accountVerified: Boolean(beneficiary.verifiedAt || (user && user.isVerified)),
      passkeyRegistered: Boolean(user && user.hasPasskey),
      ownerAssignedAssets: Boolean(user ? user.assetsAssigned : true),
      emergencyRequestApproved: Boolean(user ? user.emergencyApproved : true),
      otpVerificationCompleted: Boolean(user ? user.otpVerified : true),
      faceVerificationCompleted: Boolean(user ? user.faceVerified : true),
      adminApprovalGranted: Boolean(user ? user.adminApproved : true)
    };

    const isAccessGranted = Object.values(rules).every(Boolean);

    return res.json({
      beneficiaryId,
      beneficiaryName: beneficiary.name,
      email: beneficiary.email,
      isAccessGranted,
      status: isAccessGranted ? 'GRANTED' : 'DENIED',
      rules
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
