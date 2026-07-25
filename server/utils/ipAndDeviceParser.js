import crypto from 'crypto';

/**
 * Clean IP Address helper (Issue 8)
 * Converts ::1 and ::ffff:127.0.0.1 to "127.0.0.1 (Localhost)"
 */
export function parseClientIp(req) {
  let ip = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '127.0.0.1';

  // Handle proxy comma list
  if (typeof ip === 'string' && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Clean localhost IPv6 notation
  if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1' || ip === 'localhost') {
    return '127.0.0.1 (Localhost)';
  }

  return ip;
}

/**
 * Parse User-Agent string for Browser, Operating System, and Device Type (Issue 9)
 */
export function parseUserAgent(req) {
  const ua = req.headers['user-agent'] || 'Unknown User-Agent';

  // 1. Browser Detection
  let browser = 'Chrome';
  if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/(\d+)/);
    browser = `Firefox ${match ? match[1] : ''}`;
  } else if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/(\d+)/);
    browser = `Edge ${match ? match[1] : ''}`;
  } else if (ua.includes('Chrome/')) {
    const match = ua.match(/Chrome\/(\d+)/);
    browser = `Chrome ${match ? match[1] : ''}`;
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/(\d+)/);
    browser = `Safari ${match ? match[1] : ''}`;
  }

  // 2. Operating System Detection
  let os = 'Windows 11';
  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // 3. Device Type Detection
  let device = 'Desktop';
  if (/iPad|Tablet|PlayBook/i.test(ua)) {
    device = 'Tablet';
  } else if (/Mobile|iPhone|Android|Touch/i.test(ua)) {
    device = 'Mobile';
  }

  return {
    browser: browser.trim(),
    os: os.trim(),
    device: device.trim(),
    userAgent: ua,
    sessionId: 'sess_' + crypto.randomBytes(8).toString('hex'),
    requestId: 'req_' + crypto.randomBytes(8).toString('hex')
  };
}
