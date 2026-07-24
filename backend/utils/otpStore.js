const otpStore = new Map();

export function createOtp(userId) {
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = Date.now() + 5 * 60 * 1000;
  otpStore.set(userId, { code, expiresAt });
  return code;
}

export function verifyOtp(userId, code) {
  const entry = otpStore.get(userId);
  if (!entry) return false;

  const isValid = entry.code === code && entry.expiresAt > Date.now();
  if (isValid) {
    otpStore.delete(userId);
  }

  return isValid;
}
