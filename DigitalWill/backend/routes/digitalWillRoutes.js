import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDigitalWill, updateDigitalWill } from '../controllers/digitalWillController.js';

const router = express.Router();

router.get('/', requireAuth, getDigitalWill);
router.put('/', requireAuth, updateDigitalWill);

export default router;
