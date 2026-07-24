import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createAsset, decryptAsset, deleteAsset, getAsset, listAssets, updateAsset } from '../controllers/assetController.js';

const router = express.Router();

router.get('/', requireAuth, listAssets);
router.get('/:id', requireAuth, getAsset);
router.post('/', requireAuth, createAsset);
router.put('/:id', requireAuth, updateAsset);
router.delete('/:id', requireAuth, deleteAsset);
router.post('/:id/decrypt', requireAuth, decryptAsset);

export default router;
