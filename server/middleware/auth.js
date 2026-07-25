import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'digital_will_ai_super_secret_jwt_key_2026';

/**
 * Generate JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    { id: user._id || user.id, email: user.email, role: user.role || 'owner' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * JWT Auth Middleware — production-only JWT validation
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required. Please sign in.' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid authorization token.' });
    }
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
}

/**
 * Owner-Only Authorization Middleware (Blocks Nominees with 403 Forbidden)
 */
export async function requireOwner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  if (req.user.role && req.user.role === 'beneficiary') {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Nominees are not authorized to modify vault data or perform administrative operations.'
    });
  }

  next();
}
