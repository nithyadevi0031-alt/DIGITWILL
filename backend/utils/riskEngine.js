export function evaluateRisk({ deviceTrust, loginHistory, verificationCompleteness, locationPattern }) {
  const factors = [];

  const deviceScore = deviceTrust >= 0.8 ? 0.1 : deviceTrust >= 0.5 ? 0.25 : 0.45;
  const loginScore = loginHistory >= 0.8 ? 0.1 : loginHistory >= 0.5 ? 0.2 : 0.35;
  const verificationScore = verificationCompleteness >= 0.8 ? 0.1 : verificationCompleteness >= 0.5 ? 0.2 : 0.35;
  const locationScore = locationPattern === 'consistent' ? 0.1 : locationPattern === 'suspicious' ? 0.35 : 0.2;

  const riskScore = Math.min(100, Math.round((deviceScore + loginScore + verificationScore + locationScore) * 100));

  if (deviceTrust < 0.5) factors.push({ label: 'Device trust', weight: 0.45, value: deviceTrust });
  if (loginHistory < 0.8) factors.push({ label: 'Login history', weight: 0.35, value: loginHistory });
  if (verificationCompleteness < 0.8) factors.push({ label: 'Verification completeness', weight: 0.35, value: verificationCompleteness });
  if (locationPattern !== 'consistent') factors.push({ label: 'Location pattern', weight: 0.35, value: locationPattern });

  let recommendation = 'approve';
  if (riskScore >= 70) recommendation = 'escalate-to-admin';
  else if (riskScore >= 40) recommendation = 'require-more-verification';

  return { riskScore, factors, recommendation };
}
