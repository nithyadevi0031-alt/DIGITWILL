import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, KeyRound, Fingerprint, Mail, Lock, Eye, EyeOff, 
  ArrowRight, ShieldCheck, Sparkles, Loader2, AlertCircle, UserCheck, CheckCircle2, ChevronLeft 
} from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

export function LoginPage({ onLoginSuccess, onGoToLanding, onGoToRegister }) {
  const [authMethod, setAuthMethod] = useState('password');
  const [role, setRole] = useState('owner');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // OTP State
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    setError('');
  };

  // ── OTP Input Handlers ──
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 6) {
      setOtpDigits(pasteData.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Password Login → OTP ──
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResendVerification(false);
    setResendMessage('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid email or password.');
        if (res.status === 403) {
          setShowResendVerification(true);
        }
        setLoading(false);
        return;
      }

      // OTP required — switch to OTP screen
      if (data.otpRequired) {
        setOtpRequired(true);
        setOtpEmail(data.email || formData.email);
        setResendCooldown(60);
        setLoading(false);

        // Dev mode: auto-fill OTP if returned by backend
        if (data.devOtp) {
          const digits = data.devOtp.toString().split('');
          setOtpDigits(digits);
        }
        return;
      }

      // Direct login (fallback)
      setLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess({ ...data.user, token: data.token });
      }
    } catch (err) {
      setError('Unable to process your request. Please try again.');
      setLoading(false);
    }
  };

  // ── Verify OTP ──
  const handleVerifyOTP = async () => {
    const otp = otpDigits.join('');
    if (otp.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, otp })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setOtpError(data.message || 'Invalid OTP.');
        setOtpDigits(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        setOtpLoading(false);
        return;
      }

      // OTP verified — login successful
      setOtpLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess({ ...data.user, token: data.token });
      }
    } catch (err) {
      setOtpError('Unable to verify OTP. Please try again.');
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResendCooldown(60);
        setOtpError('');

        // Dev mode: auto-fill if OTP returned
        if (data.devOtp) {
          setOtpDigits(data.devOtp.toString().split(''));
        } else {
          setOtpDigits(['', '', '', '', '', '']);
          otpRefs.current[0]?.focus();
        }
      } else {
        setOtpError(data.message || 'Unable to resend OTP.');
      }
    } catch (err) {
      setOtpError('Unable to resend OTP. Please try again.');
    }
  };

  // ── Passkey Login ──
  const handlePasskeyLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email) {
      setError('Please enter your account email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/passkey/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch passkey options');

      let authResp;
      try {
        authResp = await startAuthentication({ optionsJSON: data.options });
      } catch (webauthnErr) {
        throw new Error('Passkey authentication was cancelled or not available.');
      }

      const verifyRes = await fetch('/api/auth/passkey/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, body: authResp })
      });
      const verifyData = await verifyRes.json();

      if (verifyData.verified) {
        setLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess({
            name: formData.email.split('@')[0],
            email: formData.email,
            role,
            authType: 'Passkey WebAuthn',
            token: verifyData.token
          });
        }
      } else {
        throw new Error(verifyData.message || 'Passkey verification failed');
      }
    } catch (err) {
      setError(err.message || 'Passkey authentication failed');
      setLoading(false);
    }
  };

  // ── Resend Verification Email ──
  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      const data = await res.json();
      setResendMessage(data.message || 'Verification email sent.');
    } catch (err) {
      setResendMessage('Unable to resend verification email. Please try again.');
    }
    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#221B2A] text-white flex flex-col justify-between selection:bg-[#9A2CF2] selection:text-white relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#731BB8]/30 via-[#9A2CF2]/20 to-transparent rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-[#32004A]/50 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER */}
      <header className="px-8 py-6 flex items-center justify-between z-10">
        <button
          onClick={onGoToLanding}
          className="flex items-center gap-2 text-xs font-semibold text-[#8D89AF] hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#9A2CF2]" /> Return to Home
        </button>

        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-base font-black text-[#D2C8BC] tracking-wider">
            DIGITAL WILL <span className="text-[#9A2CF2]">AI</span>
          </span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg glass-card p-8 border border-[#9A2CF2]/40 bg-[#2B103D]/95 shadow-2xl relative"
        >
          <AnimatePresence mode="wait">
            {otpRequired ? (
              /* ════════ OTP VERIFICATION SCREEN ════════ */
              <motion.div
                key="otp-screen"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#731BB8]/30 border border-[#9A2CF2]/40 rounded-full text-xs font-semibold text-[#9A2CF2]">
                    <ShieldCheck className="w-3.5 h-3.5" /> TWO-FACTOR AUTHENTICATION
                  </div>
                  <h2 className="text-2xl font-bold text-[#D2C8BC]">Enter OTP</h2>
                  <p className="text-xs text-[#8D89AF]">
                    A 6-digit OTP has been sent to <strong className="text-white">{otpEmail}</strong>
                  </p>
                </div>

                {/* OTP Error */}
                {otpError && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" /> {otpError}
                  </motion.div>
                )}

                {/* 6 OTP Input Boxes */}
                <div className="flex items-center justify-center gap-3" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold bg-[#221B2A]/80 border-2 border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2] transition-colors"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <button
                  onClick={handleVerifyOTP}
                  disabled={otpLoading || otpDigits.join('').length !== 6}
                  className="w-full py-3.5 btn-primary text-sm flex items-center justify-center gap-2 font-bold disabled:opacity-50"
                >
                  {otpLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying OTP...</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Verify OTP & Sign In</>
                  )}
                </button>

                {/* Resend OTP + Timer */}
                <div className="text-center space-y-2">
                  <p className="text-[11px] text-[#8D89AF]">Didn't receive the OTP?</p>
                  {resendCooldown > 0 ? (
                    <p className="text-xs text-[#9A2CF2] font-semibold">
                      Resend available in {resendCooldown}s
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOTP}
                      className="text-xs font-semibold text-[#9A2CF2] hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                {/* Back to Login */}
                <button
                  onClick={() => { setOtpRequired(false); setOtpDigits(['', '', '', '', '', '']); setOtpError(''); }}
                  className="w-full text-center text-xs text-[#8D89AF] hover:text-white transition-colors pt-2"
                >
                  ← Back to Login
                </button>
              </motion.div>
            ) : (
              /* ════════ PASSWORD LOGIN SCREEN ════════ */
              <motion.div
                key="login-screen"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
              >
                {/* Header */}
                <div className="text-center space-y-2 mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#731BB8]/30 border border-[#9A2CF2]/40 rounded-full text-xs font-semibold text-[#9A2CF2]">
                    <Sparkles className="w-3.5 h-3.5" /> SECURE AUTHENTICATION
                  </div>
                  <h2 className="text-2xl font-bold text-[#D2C8BC]">Sign In to Digital Will</h2>
                  <p className="text-xs text-[#8D89AF]">Enter your registered credentials to access your vault.</p>
                </div>

                {/* Role Selector */}
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#221B2A] rounded-xl border border-white/10 mb-5">
                  <button type="button" onClick={() => setRole('owner')}
                    className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      role === 'owner' ? 'bg-gradient-to-r from-[#731BB8] to-[#9A2CF2] text-white shadow-md' : 'text-[#8D89AF] hover:text-white'
                    }`}>
                    <ShieldCheck className="w-4 h-4" /> Vault Owner
                  </button>
                  <button type="button" onClick={() => setRole('beneficiary')}
                    className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                      role === 'beneficiary' ? 'bg-gradient-to-r from-[#731BB8] to-[#9A2CF2] text-white shadow-md' : 'text-[#8D89AF] hover:text-white'
                    }`}>
                    <UserCheck className="w-4 h-4" /> Nominee / Beneficiary
                  </button>
                </div>

                {/* Auth Method Tabs */}
                <div className="flex gap-4 mb-5 border-b border-white/10 pb-3">
                  <button type="button" onClick={() => setAuthMethod('password')}
                    className={`flex items-center gap-2 text-xs font-semibold pb-1 transition-colors ${
                      authMethod === 'password' ? 'text-[#9A2CF2] border-b-2 border-[#9A2CF2]' : 'text-[#8D89AF] hover:text-white'
                    }`}>
                    <KeyRound className="w-4 h-4" /> Email & Password
                  </button>
                  <button type="button" onClick={() => setAuthMethod('passkey')}
                    className={`flex items-center gap-2 text-xs font-semibold pb-1 transition-colors ${
                      authMethod === 'passkey' ? 'text-[#9A2CF2] border-b-2 border-[#9A2CF2]' : 'text-[#8D89AF] hover:text-white'
                    }`}>
                    <Fingerprint className="w-4 h-4" /> WebAuthn Passkey
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-5 p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Authentication Error</span>
                      {error}
                    </div>
                  </motion.div>
                )}

                {authMethod === 'passkey' ? (
                  <form onSubmit={handlePasskeyLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                        <input type="email" name="email" required placeholder="Enter registered email"
                          value={formData.email} onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm" />
                      </div>
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full py-3.5 btn-primary text-sm flex items-center justify-center gap-2 font-bold">
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</> 
                        : <><Fingerprint className="w-4 h-4" /> Sign In with Passkey</>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                        <input type="email" name="email" required placeholder="Enter registered email"
                          value={formData.email} onChange={handleChange}
                          className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider">
                          Password <span className="text-rose-400">*</span>
                        </label>
                        <button type="button" onClick={() => setForgotModalOpen(true)}
                          className="text-[11px] font-semibold text-[#9A2CF2] hover:underline">
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                        <input type={showPassword ? 'text' : 'password'} name="password" required placeholder="Enter password"
                          value={formData.password} onChange={handleChange}
                          className="w-full pl-11 pr-12 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 p-1 text-[#8D89AF] hover:text-white transition-colors">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full py-3.5 btn-primary text-sm flex items-center justify-center gap-2 font-bold">
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</> 
                        : <>Sign In to Vault <ArrowRight className="w-4 h-4" /></>}
                    </button>
                  </form>
                )}

                {/* Resend Verification */}
                {showResendVerification && (
                  <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                    <p className="text-xs text-amber-300">Your email is not verified yet.</p>
                    {resendMessage ? (
                      <p className="text-xs text-emerald-300">{resendMessage}</p>
                    ) : (
                      <button type="button" onClick={handleResendVerification} disabled={resendLoading}
                        className="py-2 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-2">
                        {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                      </button>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-[#8D89AF] space-y-1.5">
                  <div>
                    Don't have an account?{' '}
                    <button type="button" onClick={onGoToRegister} className="text-[#9A2CF2] font-semibold hover:underline">
                      Register Account
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* FORGOT PASSWORD MODAL */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md p-6 glass-card border border-[#9A2CF2]/40 bg-[#2B103D] text-center space-y-4">
              <h3 className="text-xl font-bold text-[#D2C8BC]">Reset Password</h3>
              <p className="text-xs text-[#8D89AF]">Enter your email address to receive a recovery link.</p>
              
              {resetSent ? (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Recovery link sent!
                </div>
              ) : (
                <div className="space-y-4">
                  <input type="email" placeholder="Enter email address" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[#221B2A] border border-white/10 rounded-xl text-white text-sm" />
                  <button onClick={() => setResetSent(true)} className="w-full py-3 btn-primary text-xs font-bold">
                    Send Recovery Email
                  </button>
                </div>
              )}

              <button onClick={() => { setForgotModalOpen(false); setResetSent(false); }}
                className="text-xs text-[#8D89AF] hover:text-white pt-2 block mx-auto">
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-4 text-center text-xs text-[#8D89AF]">
        © 2026 Digital Will AI • Luxury Cyber Security Vault
      </footer>
    </div>
  );
}
