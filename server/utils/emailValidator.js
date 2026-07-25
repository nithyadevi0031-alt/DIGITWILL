import validator from 'validator';
import dns from 'dns/promises';
import { Resolver } from 'dns/promises';
import net from 'net';

// Public DNS resolvers as fallback
const publicResolver = new Resolver();
publicResolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

// Comprehensive disposable email domain list
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'trashmail.com', 'dispostable.com',
  'sharklasers.com', 'getnada.com', 'throwawaymail.com', 'mytemp.email',
  'fakeinbox.com', 'mailnesia.com', 'maildrop.cc', 'crazymailing.com',
  '0815.ru', '10minutemail.co.uk', '10minutemail.net', '20minutemail.com',
  'guerrillamailblock.com', 'grr.la', 'guerrillamail.info', 'guerrillamail.net',
  'tempail.com', 'tempr.email', 'discard.email', 'discardmail.com',
  'mailcatch.com', 'mintemail.com', 'mohmal.com', 'burnermail.io',
  'harakirimail.com', 'jetable.org', 'mailexpire.com', 'mailforspam.com',
  'guerrillamail.de', 'spam4.me', 'trashymail.com', 'wegwerfmail.de',
  'wegwerfmail.net', 'einrot.com', 'emailondeck.com', 'mailinator.net',
  'mailinator.org', 'sogetthis.com', 'spamfree24.org', 'spamgourmet.com',
  'tempinbox.com', 'thankyou2010.com', 'binkmail.com', 'bobmail.info',
  'chammy.info', 'devnullmail.com', 'emailigo.de', 'emailtemporario.com.br',
  'ephemail.net', 'filzmail.com', 'gishpuppy.com', 'guerrillamail.biz',
  'harakirimail.com', 'incognitomail.com', 'ipoo.org', 'kasmail.com',
  'lookugly.com', 'mailbidon.com', 'mailblocks.com', 'mailhazard.com',
  'mailhazard.us', 'mailme.lv', 'mailmetrash.com', 'mailmoat.com',
  'mailnull.com', 'mailshell.com', 'mailsiphon.com', 'mailzilla.com',
  'nomail.xl.cx', 'nospam.ze.tc', 'owlpic.com', 'proxymail.eu',
  'rcpt.at', 'reallymymail.com', 'recode.me', 'regbypass.com',
  'safetymail.info', 'skeefmail.com', 'slaskpost.se', 'spambox.us',
  'spamcero.com', 'spamday.com', 'spamfighter.cf', 'spamfighter.ga',
  'spamfighter.gq', 'spamfighter.ml', 'spamfighter.tk', 'spamfree.eu',
  'spaml.com', 'spamoff.de', 'spamstack.net', 'superrito.com',
  'teleworm.us', 'tempmailer.com', 'tempymail.com', 'throwam.com',
  'tittbit.in', 'tradermail.info', 'trash-mail.at', 'trash-mail.com',
  'trash2009.com', 'turual.com', 'uggsrock.com', 'upliftnow.com',
  'venompen.com', 'veryreallyfakemail.com', 'wh4f.org', 'whyspam.me',
  'willselfdestruct.com', 'winemaven.info', 'wronghead.com'
]);

/**
 * Step 3: DNS MX / A Record Lookup with public DNS fallback
 */
async function resolveDomainMX(domain) {
  // Primary DNS
  try {
    const records = await dns.resolveMx(domain);
    if (records && records.length > 0) return { exists: true, mx: records };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      try {
        const aRecords = await dns.resolve4(domain);
        if (aRecords && aRecords.length > 0) return { exists: true };
      } catch (aErr) {
        if (aErr.code === 'ENOTFOUND' || aErr.code === 'ENODATA') {
          return { exists: false, reason: 'NOT_FOUND' };
        }
      }
    }
  }

  // Fallback to Public DNS
  try {
    const mxRecords = await publicResolver.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) return { exists: true, mx: mxRecords };
  } catch (publicErr) {
    if (publicErr.code === 'ENOTFOUND' || publicErr.code === 'ENODATA') {
      try {
        const aRecords = await publicResolver.resolve4(domain);
        if (aRecords && aRecords.length > 0) return { exists: true };
      } catch (aErr) {
        if (aErr.code === 'ENOTFOUND' || aErr.code === 'ENODATA') {
          return { exists: false, reason: 'NOT_FOUND' };
        }
      }
    }
  }

  // Network completely offline — accept valid syntax domains gracefully
  return { exists: true, fallback: true };
}

/**
 * Step 4: SMTP Mailbox Verification
 * Connects to MX server on port 25, sends RCPT TO to check if mailbox exists.
 * Best-effort: many servers accept all (catch-all). Timeouts/errors = Unknown (accepted).
 */
async function verifyMailboxSMTP(email, mxRecords) {
  if (!mxRecords || mxRecords.length === 0) {
    return { status: 'Unknown', message: 'No MX records for SMTP check' };
  }

  // Sort by priority (lowest = highest priority)
  const sorted = [...mxRecords].sort((a, b) => a.priority - b.priority);
  const mxHost = sorted[0].exchange;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ status: 'Unknown', message: 'SMTP verification timed out — email accepted' });
    }, 8000);

    const socket = net.createConnection({ port: 25, host: mxHost, timeout: 8000 });
    let step = 0;
    let response = '';

    socket.on('data', (data) => {
      response = data.toString();

      if (step === 0 && response.startsWith('220')) {
        socket.write(`EHLO digiwill.ai\r\n`);
        step = 1;
      } else if (step === 1 && (response.startsWith('250') || response.startsWith('220'))) {
        socket.write(`MAIL FROM:<verify@digiwill.ai>\r\n`);
        step = 2;
      } else if (step === 2 && response.startsWith('250')) {
        socket.write(`RCPT TO:<${email}>\r\n`);
        step = 3;
      } else if (step === 3) {
        clearTimeout(timeout);
        socket.write('QUIT\r\n');
        socket.end();

        if (response.startsWith('250')) {
          resolve({ status: 'Deliverable', message: 'Mailbox exists and is deliverable' });
        } else if (response.startsWith('550') || response.startsWith('551') || response.startsWith('553')) {
          resolve({ status: 'Undeliverable', message: 'Mailbox does not exist on this server' });
        } else if (response.startsWith('452') || response.startsWith('421')) {
          resolve({ status: 'Risky', message: 'Mailbox may exist but server returned a temporary error' });
        } else {
          // Catch-all or greylisting — accept as Unknown
          resolve({ status: 'Unknown', message: 'SMTP response inconclusive — email accepted' });
        }
      }
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      // Port 25 blocked or connection refused — accept gracefully
      resolve({ status: 'Unknown', message: 'SMTP connection unavailable — email accepted' });
    });

    socket.on('timeout', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({ status: 'Unknown', message: 'SMTP verification timed out — email accepted' });
    });
  });
}

/**
 * 5-Step Email Validation Pipeline
 * Step 1: Syntax  |  Step 2: Domain  |  Step 3: MX Records  |  Step 4: SMTP  |  Step 5: Final Verdict
 * 
 * Returns: { isValid, status, message, details }
 * Status enum: 'Deliverable' | 'Undeliverable' | 'Risky' | 'Disposable' | 'Unknown'
 */
export async function validateEmailExistence(email) {
  if (!email || typeof email !== 'string') {
    return { success: false, isValid: false, status: 'Undeliverable', message: 'Invalid email format.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Step 1: Syntax Validation
  if (!validator.isEmail(cleanEmail)) {
    return { success: false, isValid: false, status: 'Undeliverable', message: 'Invalid email format.' };
  }

  const parts = cleanEmail.split('@');
  if (parts.length !== 2) {
    return { success: false, isValid: false, status: 'Undeliverable', message: 'Invalid email format.' };
  }

  const [username, domain] = parts;

  if (!domain || domain.length < 3 || !domain.includes('.')) {
    return { success: false, isValid: false, status: 'Undeliverable', message: 'Invalid email format.' };
  }

  // Step 2: Disposable Email Check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      success: false, isValid: false, status: 'Disposable',
      message: 'Disposable email addresses are not allowed.'
    };
  }

  // Step 3: Domain Existence + MX Record Check
  const dnsResult = await resolveDomainMX(domain);

  if (!dnsResult.exists) {
    return {
      success: false, isValid: false, status: 'Undeliverable',
      message: 'Email domain does not exist.'
    };
  }

  // Step 4: SMTP Mailbox Verification (best-effort)
  let smtpResult = { status: 'Unknown', message: 'SMTP check skipped' };
  if (dnsResult.mx && dnsResult.mx.length > 0) {
    try {
      smtpResult = await verifyMailboxSMTP(cleanEmail, dnsResult.mx);
    } catch (smtpErr) {
      // SMTP check failed — accept gracefully
      smtpResult = { status: 'Unknown', message: 'SMTP check encountered an error — email accepted' };
    }
  }

  // Step 5: Final Verdict
  if (smtpResult.status === 'Undeliverable') {
    return {
      success: false, isValid: false, status: 'Undeliverable',
      message: 'This email address does not exist.',
      details: { dns: dnsResult, smtp: smtpResult }
    };
  }

  // Deliverable, Risky, or Unknown — all accepted
  return {
    success: true, isValid: true,
    status: smtpResult.status || 'Deliverable',
    message: '✓ Email verified successfully.',
    details: { dns: dnsResult, smtp: smtpResult }
  };
}
