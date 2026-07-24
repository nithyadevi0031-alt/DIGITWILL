import Asset from '../models/Asset.js';
import AuditLog from '../models/AuditLog.js';
import { encryptSensitiveData, decryptSensitiveData } from '../utils/encryption.js';

function sanitizeAsset(asset) {
  const plain = asset.toObject ? asset.toObject() : asset;
  const { encryptedData, iv, authTag, ...rest } = plain;
  return rest;
}

function buildAssetPayload(body, ownerId, existingAsset) {
  const metadata = {
    ...(existingAsset?.metadata || {}),
    notes: body.notes || existingAsset?.metadata?.notes || '',
    description: body.description || existingAsset?.metadata?.description || '',
  };

  const basePayload = {
    ownerId,
    assetType: body.assetType || existingAsset?.assetType || 'other',
    name: body.name || existingAsset?.name || 'Unnamed asset',
    category: body.category || existingAsset?.category || 'documents',
    securityLevel: body.securityLevel || existingAsset?.securityLevel || 'medium',
    emergencyPolicy: body.emergencyPolicy || existingAsset?.emergencyPolicy || 'review-required',
    metadata,
    encrypted: true,
  };

  if (body.value || body.sensitiveValue) {
    const sensitiveValue = body.value || body.sensitiveValue;
    const encrypted = encryptSensitiveData(JSON.stringify({ value: sensitiveValue }));
    return {
      ...basePayload,
      encryptedData: encrypted.encryptedData,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
    };
  }

  if (existingAsset) {
    return basePayload;
  }

  return {
    ...basePayload,
    encryptedData: '',
    iv: '',
    authTag: '',
  };
}

export async function listAssets(req, res) {
  try {
    const assets = await Asset.find({ ownerId: req.user.id }).sort({ createdAt: -1 });
    res.json({ assets: assets.map(sanitizeAsset) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load assets' });
  }
}

export async function getAsset(req, res) {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const safeAsset = sanitizeAsset(asset);
    res.json({ asset: safeAsset });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load asset' });
  }
}

export async function decryptAsset(req, res) {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const decryptedValue = decryptSensitiveData(asset.encryptedData, asset.iv, asset.authTag);
    res.json({ asset: { ...sanitizeAsset(asset), decryptedValue: JSON.parse(decryptedValue).value } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to decrypt asset' });
  }
}

export async function createAsset(req, res) {
  try {
    const payload = buildAssetPayload(req.body, req.user.id);
    const asset = await Asset.create(payload);

    await AuditLog.create({
      actorId: req.user.id,
      actorRole: 'owner',
      action: 'create-asset',
      targetType: 'asset',
      targetId: asset._id.toString(),
      details: { name: asset.name, category: asset.category },
      severity: 'info',
    });

    res.status(201).json({ asset: sanitizeAsset(asset) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create asset' });
  }
}

export async function updateAsset(req, res) {
  try {
    const asset = await Asset.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const payload = buildAssetPayload(req.body, req.user.id, asset);
    Object.assign(asset, payload);
    await asset.save();

    res.json({ asset: sanitizeAsset(asset) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update asset' });
  }
}

export async function deleteAsset(req, res) {
  try {
    const result = await Asset.deleteOne({ _id: req.params.id, ownerId: req.user.id });
    res.json({ ok: result.deletedCount > 0 });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete asset' });
  }
}
