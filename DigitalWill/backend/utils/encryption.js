import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'digital-will-demo-key-please-change').digest();

export function encryptSensitiveData(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(plainText, 'utf8')), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedData: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

export function decryptSensitiveData(encryptedData, iv, authTag) {
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}
