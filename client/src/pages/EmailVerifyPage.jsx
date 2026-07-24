import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function EmailVerifyPage({ rawToken, onGoToLogin }) {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email/${rawToken}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setSuccess(true);
        } else {
          setError(data.message || 'Verification failed.');
        }
      } catch (err) {
        setError('Unable to verify email. Please try again.');
      }
      setLoading(false);
    };

    if (rawToken) {
      verifyEmail();
    } else {
      setError('Invalid verification link.');
      setLoading(false);
    }
  }, [rawToken]);

  return (
    <div className="min-h-screen bg-[#221B2A] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#731BB8]/30 via-[#9A2CF2]/20 to-transparent rounded-full blur-[130px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md glass-card p-8 border border-[#9A2CF2]/40 bg-[#2B103D]/95 text-center space-y-6 z-10"
      >
        <div className="flex justify-center">
          <div className="p-3 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-2xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#D2C8BC]">Email Verification</h2>

        {loading ? (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 text-[#9A2CF2] animate-spin mx-auto" />
            <p className="text-sm text-[#8D89AF]">Verifying your email address...</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-emerald-300">Email Verified Successfully</h3>
              <p className="text-xs text-[#8D89AF] mt-2">Your account has been activated. You may now sign in.</p>
            </div>
            <button onClick={onGoToLogin} className="w-full py-3 btn-primary text-sm font-bold">
              Go to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-rose-300">Verification Failed</h3>
              <p className="text-xs text-[#8D89AF] mt-2">{error}</p>
            </div>
            <button onClick={onGoToLogin} className="w-full py-3 btn-primary text-sm font-bold">
              Go to Sign In
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
