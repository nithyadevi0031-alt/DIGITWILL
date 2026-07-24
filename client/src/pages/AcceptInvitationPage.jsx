import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, FileText, Lock, 
  User, Mail, HeartHandshake, Loader2, Sparkles, KeyRound, ExternalLink 
} from 'lucide-react';
import { PasskeyPrompt } from '../components/PasskeyPrompt';

export function AcceptInvitationPage({ rawToken, onComplete }) {
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [acceptedState, setAcceptedState] = useState(false);
  const [declinedState, setDeclinedState] = useState(false);

  const [showPasskeyFlow, setShowPasskeyFlow] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!rawToken) {
      setError('No invitation token provided in URL');
      setLoading(false);
      return;
    }

    fetch(`/api/beneficiaries/invitation/${rawToken}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setInvitation(data.beneficiary);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to resolve invitation token');
        setLoading(false);
      });
  }, [rawToken]);

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline this beneficiary nomination?')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/beneficiaries/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawToken })
      });
      if (res.ok) {
        setDeclinedState(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to decline invitation');
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const handlePasskeySuccess = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/beneficiaries/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawToken })
      });

      const data = await res.json();
      if (res.ok) {
        setAcceptedState(true);
      } else {
        alert(data.error || 'Acceptance failed');
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#221B2A] flex items-center justify-center p-6 text-[#8D89AF]">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-[#9A2CF2] animate-spin mx-auto" />
          <p className="text-sm font-semibold">Resolving Cryptographic Nomination Token...</p>
        </div>
      </div>
    );
  }

  // STEP 8: Token Expired or Invalid View
  if (error || (invitation && invitation.isExpired)) {
    return (
      <div className="min-h-screen bg-[#221B2A] flex items-center justify-center p-6 text-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 border border-[#D95F30]/40 max-w-lg w-full text-center space-y-6 bg-[#2B103D]">
          <div className="w-16 h-16 bg-[#D95F30]/20 rounded-2xl border border-[#D95F30] flex items-center justify-center mx-auto text-[#D95F30]">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#D2C8BC]">Invitation Expired or Invalid</h2>
            <p className="text-xs text-[#8D89AF] leading-relaxed">
              {error || 'This 24-hour beneficiary invitation token has expired or has already been consumed.'}
            </p>
          </div>

          <div className="p-4 bg-[#221B2A] border border-white/10 rounded-xl text-left text-xs space-y-2">
            <p className="text-[#D2C8BC] font-semibold">What should you do next?</p>
            <p className="text-[#8D89AF]">
              Please contact the vault owner (<strong className="text-white">{invitation?.ownerName || 'Alexander Vance'}</strong>) and request them to click <strong>"Resend Invitation"</strong> on their Digital Will AI owner dashboard.
            </p>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-[#D2C8BC] rounded-xl text-xs font-semibold"
          >
            Return to Digital Will AI Home
          </button>
        </motion.div>
      </div>
    );
  }

  // Success accepted view
  if (acceptedState) {
    return (
      <div className="min-h-screen bg-[#221B2A] flex items-center justify-center p-6 text-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 border border-emerald-500/40 max-w-lg w-full text-center space-y-6 bg-[#2B103D]">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 purple-glow">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-emerald-300">Nomination Accepted & Verified!</h2>
            <p className="text-xs text-[#8D89AF]">
              You have successfully accepted the beneficiary nomination from <strong className="text-white">{invitation.ownerName}</strong> and registered your hardware Passkey.
            </p>
          </div>

          <div className="p-4 bg-[#221B2A] border border-white/10 rounded-xl text-xs space-y-2 text-left text-[#8D89AF]">
            <div className="flex justify-between">
              <span>Status Badge:</span>
              <span className="text-emerald-400 font-bold">Verified & Accepted</span>
            </div>
            <div className="flex justify-between">
              <span>Passkey Hardware:</span>
              <span className="text-[#9A2CF2] font-mono">Registered (WebAuthn)</span>
            </div>
            <div className="flex justify-between">
              <span>Timestamp:</span>
              <span className="text-[#D2C8BC] font-mono">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3.5 btn-primary text-xs font-bold"
          >
            Go to Vault Home
          </button>
        </motion.div>
      </div>
    );
  }

  // Decline view
  if (declinedState) {
    return (
      <div className="min-h-screen bg-[#221B2A] flex items-center justify-center p-6 text-white">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-8 border border-rose-500/40 max-w-lg w-full text-center space-y-4 bg-[#2B103D]">
          <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-rose-300">Invitation Declined</h2>
          <p className="text-xs text-[#8D89AF]">
            You have declined the nomination. The owner ({invitation.ownerName}) has been notified.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#221B2A] text-white py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* HEADER BRAND */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#731BB8]/30 border border-[#9A2CF2]/40 rounded-full text-xs font-semibold text-[#9A2CF2]">
            <Sparkles className="w-4 h-4" /> OFFICIAL NOMINATION NOTICE
          </div>
          <h1 className="text-3xl font-extrabold text-[#D2C8BC]">Accept Beneficiary Nomination</h1>
          <p className="text-xs text-[#8D89AF]">Digital Will AI Encrypted Asset Vault Protocol</p>
        </div>

        {/* STEP 5 CARD: OWNER NAME, RELATIONSHIP, EMAIL, TERMS & PRIVACY */}
        <div className="glass-card p-8 border border-[#9A2CF2]/40 bg-[#2B103D]/95 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-[#221B2A] border border-white/10 rounded-2xl">
            <div>
              <span className="text-[10px] font-bold text-[#8D89AF] uppercase tracking-wider block mb-1">Estate Vault Owner</span>
              <div className="text-base font-bold text-[#D2C8BC] flex items-center gap-2">
                <User className="w-4 h-4 text-[#9A2CF2]" /> {invitation.ownerName}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-[#8D89AF] uppercase tracking-wider block mb-1">Designated Relationship</span>
              <div className="text-base font-bold text-[#9A2CF2] flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#9A2CF2]" /> {invitation.relationship}
              </div>
            </div>

            <div className="sm:col-span-2 pt-3 border-t border-white/5">
              <span className="text-[10px] font-bold text-[#8D89AF] uppercase tracking-wider block mb-1">Nominated Beneficiary Email</span>
              <div className="text-sm font-semibold text-white flex items-center gap-2 font-mono">
                <Mail className="w-4 h-4 text-[#8D89AF]" /> {invitation.email}
              </div>
            </div>
          </div>

          {/* TERMS & PRIVACY NOTICE */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#D2C8BC] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#9A2CF2]" /> Terms of Beneficiary Designation & Privacy Notice
            </h4>
            <div className="p-4 bg-[#221B2A]/90 border border-white/5 rounded-xl text-xs text-[#8D89AF] leading-relaxed max-h-36 overflow-y-auto space-y-2">
              <p>
                By accepting this nomination, you consent to register an unphishable WebAuthn Passkey (Touch ID, Face ID, Windows Hello, or Hardware Key) to establish your cryptographic identity.
              </p>
              <p>
                No emergency access is granted immediately. Access to digital assets is bound strictly by the 8 Emergency Protocol Rules defined by the vault owner.
              </p>
              <p>
                Your device IP address, browser fingerprint, and timestamp will be stored securely in the immutable audit log for compliance.
              </p>
            </div>
          </div>

          {/* PASSKEY CREATION OR BUTTONS */}
          {showPasskeyFlow ? (
            <PasskeyPrompt
              email={invitation.email}
              name={invitation.name}
              onPasskeySuccess={handlePasskeySuccess}
            />
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-white/10">
              <button
                onClick={handleDecline}
                disabled={isSubmitting}
                className="w-full sm:w-1/3 py-3.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-xl text-xs border border-rose-500/40 transition-colors"
              >
                Decline Nomination
              </button>

              <button
                onClick={() => setShowPasskeyFlow(true)}
                disabled={isSubmitting}
                className="w-full sm:w-2/3 py-3.5 btn-primary text-xs font-bold flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Accept Invitation & Secure Passkey
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
