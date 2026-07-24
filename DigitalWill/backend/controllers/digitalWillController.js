import Asset from '../models/Asset.js';
import Beneficiary from '../models/Beneficiary.js';
import DigitalWill from '../models/DigitalWill.js';
import User from '../models/User.js';

export async function getDigitalWill(req, res) {
  try {
    const user = await User.findById(req.user.id);
    const assets = await Asset.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    const beneficiaries = await Beneficiary.find({ ownerId: req.user.id }).sort({ createdAt: -1 });

    let will = await DigitalWill.findOne({ ownerId: req.user.id });
    const releaseConditions = {
      waitingPeriodDays: 30,
      adminApprovalRequired: true,
      notes: 'Review and identity verification required.',
    };

    if (!will) {
      will = await DigitalWill.create({
        ownerId: req.user.id,
        ownerName: user?.fullName || 'Owner',
        assets: assets.map((asset) => asset._id),
        beneficiaries: beneficiaries.map((beneficiary) => beneficiary._id),
        releaseConditions,
        summary: 'Protected digital inheritance plan generated from linked assets and beneficiaries.',
      });
    } else {
      will.ownerName = user?.fullName || 'Owner';
      will.assets = assets.map((asset) => asset._id);
      will.beneficiaries = beneficiaries.map((beneficiary) => beneficiary._id);
      will.releaseConditions = { ...(will.releaseConditions || releaseConditions), ...req.body?.releaseConditions };
      await will.save();
    }

    const populatedWill = await DigitalWill.findById(will._id).populate('assets').populate('beneficiaries');
    res.json({ will: populatedWill });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load digital will' });
  }
}

export async function updateDigitalWill(req, res) {
  try {
    let will = await DigitalWill.findOne({ ownerId: req.user.id });
    if (!will) {
      return res.status(404).json({ message: 'Digital will not found' });
    }

    will.releaseConditions = {
      ...(will.releaseConditions || {}),
      ...(req.body?.releaseConditions || {}),
    };
    will.summary = req.body?.summary || will.summary;
    await will.save();

    const populatedWill = await DigitalWill.findById(will._id).populate('assets').populate('beneficiaries');
    res.json({ will: populatedWill });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update digital will' });
  }
}
