import Beneficiary from '../models/Beneficiary.js';
import AuditLog from '../models/AuditLog.js';

function validateBeneficiaryPayload(payload) {
  const errors = [];
  if (!payload.name || !payload.name.trim()) errors.push('Name is required');
  if (!payload.relationship || !payload.relationship.trim()) errors.push('Relationship is required');
  if (payload.phone && !/^\+?[0-9\s()-]{7,15}$/.test(payload.phone)) errors.push('Phone number must look valid');
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.push('Email must be valid');

  if (payload.assetIds && !Array.isArray(payload.assetIds)) {
    errors.push('Assigned assets must be an array');
  }

  return errors;
}

export async function listBeneficiaries(req, res) {
  try {
    const beneficiaries = await Beneficiary.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ beneficiaries });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load beneficiaries' });
  }
}

export async function createBeneficiary(req, res) {
  try {
    const errors = validateBeneficiaryPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors[0] });
    }

    const duplicate = await Beneficiary.findOne({ ownerId: req.user.id, email: req.body.email || '' });
    if (duplicate) {
      return res.status(409).json({ message: 'A beneficiary with that email already exists' });
    }

    const beneficiary = await Beneficiary.create({ ownerId: req.user.id, ...req.body });
    await AuditLog.create({
      actorId: req.user.id,
      actorRole: 'owner',
      action: 'create-beneficiary',
      targetType: 'beneficiary',
      targetId: beneficiary._id.toString(),
      details: { name: beneficiary.name, relationship: beneficiary.relationship },
      severity: 'info',
    });
    res.status(201).json({ beneficiary });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create beneficiary' });
  }
}

export async function updateBeneficiary(req, res) {
  try {
    const errors = validateBeneficiaryPayload(req.body);
    if (errors.length) {
      return res.status(400).json({ message: errors[0] });
    }

    const beneficiary = await Beneficiary.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!beneficiary) {
      return res.status(404).json({ message: 'Beneficiary not found' });
    }

    Object.assign(beneficiary, req.body);
    await beneficiary.save();
    res.json({ beneficiary });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update beneficiary' });
  }
}

export async function deleteBeneficiary(req, res) {
  try {
    const result = await Beneficiary.deleteOne({ _id: req.params.id, ownerId: req.user.id });
    res.json({ ok: result.deletedCount > 0 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete beneficiary' });
  }
}
