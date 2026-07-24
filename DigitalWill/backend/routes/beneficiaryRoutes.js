import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createBeneficiary, deleteBeneficiary, listBeneficiaries, updateBeneficiary } from '../controllers/beneficiaryController.js';

const router = express.Router();

router.get('/', requireAuth, listBeneficiaries);
router.post('/', requireAuth, createBeneficiary);
router.put('/:id', requireAuth, updateBeneficiary);
router.delete('/:id', requireAuth, deleteBeneficiary);

export default router;
