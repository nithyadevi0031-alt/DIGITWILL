import crypto from 'crypto';

/**
 * Generate a cryptographically secure random invitation token
 * Returns raw token (for URL) and hashed token (for MongoDB storage)
 */
export function createInvitationToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  // Token expires in 24 hours
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return {
    rawToken,
    hashedToken,
    expiry
  };
}

/**
 * Hash an incoming raw token string for DB comparison
 */
export function hashToken(rawToken) {
  return crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
}
