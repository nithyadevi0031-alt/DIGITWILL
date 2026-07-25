import express from 'express';
import { Asset } from '../models/Asset.js';
import { isMongoConnected, memoryStore } from '../config/db.js';
import { logAuditEvent } from '../utils/auditLogger.js';
import { requireAuth, requireOwner } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/assets - Add Asset (Owner Only - Module 10)
 */
router.post('/', requireAuth, requireOwner, async (req, res) => {
  try {
    const { assetName, assetType, estimatedValue, assignedBeneficiary, nomineeEmail, ownerName, encryptionStatus, description } = req.body;

    if (!assetName || !assetType || !estimatedValue || !assignedBeneficiary) {
      return res.status(400).json({ 
        success: false, 
        message: 'Asset Name, Asset Type, Estimated Value, and Assigned Beneficiary are required.' 
      });
    }

    const ownerId = req.user.id || req.user._id || 'owner_user';

    const assetData = {
      ownerId,
      assetName: assetName.trim(),
      assetType: assetType.trim(),
      estimatedValue: estimatedValue.trim(),
      assignedBeneficiary: assignedBeneficiary.trim(),
      nomineeEmail: nomineeEmail ? nomineeEmail.trim().toLowerCase() : '',
      ownerName: ownerName || req.user.fullName || req.user.name || 'Vault Owner',
      encryptionStatus: encryptionStatus || 'AES-256 Encrypted',
      description: description ? description.trim() : '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let asset;
    if (isMongoConnected) {
      asset = await Asset.create(assetData);
    } else {
      asset = { _id: 'asset_' + Date.now(), ...assetData };
      memoryStore.assets = memoryStore.assets || [];
      memoryStore.assets.push(asset);
    }

    await logAuditEvent({
      action: 'Asset Added',
      req,
      userEmail: req.user.email || 'owner@digiwill.ai',
      role: req.user.role || 'owner',
      status: 'SUCCESS',
      description: `Asset "${assetName}" (${assetType}) added`
    });

    return res.status(201).json({
      success: true,
      message: 'Asset added successfully.',
      asset
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to add asset. Please try again.' });
  }
});

/**
 * GET /api/assets & GET /api/assets/my-assets - List Assets (Role Based Access Control - Module 2 & 10)
 */
const getAssetsHandler = async (req, res) => {
  try {
    const userRole = req.user.role || 'owner';
    const userEmail = (req.user.email || '').toLowerCase().trim();
    const ownerId = req.user.id || req.user._id || 'owner_user';

    let assets = [];

    if (isMongoConnected) {
      if (userRole === 'beneficiary') {
        assets = await Asset.find({
          $or: [
            { nomineeEmail: userEmail },
            { assignedBeneficiary: { $regex: userEmail, $options: 'i' } }
          ]
        }).sort({ createdAt: -1 });
      } else {
        assets = await Asset.find({ ownerId }).sort({ createdAt: -1 });
      }
    } else {
      const allAssets = memoryStore.assets || [];
      if (userRole === 'beneficiary') {
        assets = allAssets.filter(a => 
          (a.nomineeEmail && a.nomineeEmail.toLowerCase() === userEmail) ||
          (a.assignedBeneficiary && a.assignedBeneficiary.toLowerCase().includes(userEmail))
        );
      } else {
        assets = allAssets.filter(a => a.ownerId === ownerId);
      }
    }

    return res.json({ success: true, assets });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

router.get('/', requireAuth, getAssetsHandler);
router.get('/my-assets', requireAuth, getAssetsHandler);

/**
 * PUT /api/assets/:id - Update Asset (Owner Only - Module 10)
 */
router.put('/:id', requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const updatePayload = { ...req.body, updatedAt: new Date() };

    let asset;
    if (isMongoConnected) {
      asset = await Asset.findByIdAndUpdate(id, updatePayload, { new: true });
    } else {
      asset = (memoryStore.assets || []).find(a => a._id === id);
      if (asset) Object.assign(asset, updatePayload);
    }

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    await logAuditEvent({
      action: 'Asset Updated',
      req,
      userEmail: req.user.email || 'owner@digiwill.ai',
      role: req.user.role || 'owner',
      status: 'SUCCESS',
      description: `Asset "${asset.assetName}" updated`
    });

    return res.json({ success: true, message: 'Asset updated successfully.', asset });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * DELETE /api/assets/:id - Delete Asset (Owner Only - Module 10)
 */
router.delete('/:id', requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;

    if (isMongoConnected) {
      await Asset.findByIdAndDelete(id);
    } else {
      memoryStore.assets = (memoryStore.assets || []).filter(a => a._id !== id);
    }

    await logAuditEvent({
      action: 'Asset Deleted',
      req,
      userEmail: req.user.email || 'owner@digiwill.ai',
      role: req.user.role || 'owner',
      status: 'SUCCESS',
      description: 'Asset deleted'
    });

    return res.json({ success: true, message: 'Asset deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
