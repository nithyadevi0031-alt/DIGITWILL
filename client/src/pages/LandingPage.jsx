import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Lock, KeyRound, Cpu, CheckCircle2, ArrowRight, Sparkles, Server, 
  Mail, Users, Eye, HelpCircle, Send, Terminal, Zap, FileText, ChevronRight, Fingerprint, ShieldCheck 
} from 'lucide-react';
import { Footer } from '../components/Footer';
export function LandingPage({ onGoToDashboard, onGoToLogin }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: 'How does the Email Existence & Deliverability check work?',
      a: 'Before sending any invitation, Digital Will AI executes syntax validation, DNS MX record lookup, domain deliverability checks, and disposable email detection (filtering out temporary providers). If a mailbox is undeliverable, the system rejects it immediately with "This email address cannot receive emails."'
    },
    {
      q: 'Why are Passkeys used instead of passwords for beneficiaries?',
      a: 'Passkeys (FIDO2 / WebAuthn standard) eliminate password-based attacks, credential stuffing, and phishing. Beneficiaries authenticate using device biometrics (Touch ID, Face ID, Windows Hello) or physical hardware security keys.'
    },
    {
      q: 'What happens when an invitation link expires after 24 hours?',
      a: 'Invitation tokens are cryptographically generated and stored as SHA-256 hashes in MongoDB. Once 24 hours pass, the token automatically expires. The owner can click "Resend Invitation" on the dashboard to generate a fresh token and dispatch a new email.'
    },
    {
      q: 'Under what conditions is emergency access granted to a beneficiary?',
      a: 'Emergency access is strictly denied unless 8 mandatory protocol rules are satisfied: Beneficiary accepted invitation, account verified, Passkey registered, owner assigned assets, emergency request approved, OTP verified, face check passed, and admin approval.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#221B2A] text-white selection:bg-[#9A2CF2] selection:text-white">
      {/* SECTION 2: HERO SECTION */}
      <section id="hero" className="relative pt-16 pb-24 overflow-hidden">
        {/* Animated Floating Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#731BB8]/30 via-[#9A2CF2]/20 to-transparent rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#32004A]/50 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4C0F7A]/40 border border-[#9A2CF2]/40 rounded-full text-xs font-semibold text-[#D2C8BC] backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#9A2CF2]" />
              <span>Next-Gen Cryptographic Estate Vault</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Nominee & Beneficiary <br />
              <span className="text-gradient">Verification Protocol</span>
            </h1>

            <p className="text-base sm:text-lg text-[#8D89AF] leading-relaxed max-w-xl">
              Automated, zero-password digital asset transfer. Validate email MX deliverability, issue 24-hour cryptographic invitation tokens, and enforce WebAuthn Passkey hardware verification.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onGoToDashboard}
                className="px-8 py-4 btn-primary text-base font-bold flex items-center gap-3 group"
              >
                Launch Owner Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#features"
                className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-[#D2C8BC] transition-all flex items-center gap-2"
              >
                Explore Verification Engine
              </a>
            </div>

            {/* Micro Stats */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 text-xs">
              <div>
                <span className="block text-xl font-bold text-[#D2C8BC]">24-Hour</span>
                <span className="text-[#8D89AF]">Signed Link Expiry</span>
              </div>
              <div>
                <span className="block text-xl font-bold text-[#9A2CF2]">WebAuthn</span>
                <span className="text-[#8D89AF]">Passkey Standard</span>
              </div>
              <div>
                <span className="block text-xl font-bold text-emerald-400">MX Verified</span>
                <span className="text-[#8D89AF]">Zero Disposable Mail</span>
              </div>
            </div>
          </motion.div>

          {/* AI Vault Graphic Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="glass-card p-8 border border-[#9A2CF2]/40 bg-[#2B103D]/80 relative overflow-hidden space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-xs font-mono text-[#9A2CF2] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> SECURE_VAULT_NODE_v2.4
                </span>
              </div>

              {/* Central Vault Graphic */}
              <div className="py-8 text-center space-y-4">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-3xl flex items-center justify-center mx-auto shadow-2xl purple-glow">
                    <ShieldCheck className="w-12 h-12 text-white" />
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                    className="absolute -inset-4 border border-dashed border-[#9A2CF2]/50 rounded-full pointer-events-none"
                  />
                </div>
                <h3 className="text-xl font-bold text-[#D2C8BC]">Digital Will AI Encrypted Core</h3>
                <p className="text-xs text-[#8D89AF]">Real-time MX validation & FIDO2 passkey hardware token verification</p>
              </div>

              {/* Status Simulation Pills */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-[#221B2A]/90 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <span className="text-emerald-300 font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Domain MX & Mailbox Deliverability
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">VERIFIED</span>
                </div>

                <div className="p-3 bg-[#221B2A]/90 border border-[#9A2CF2]/30 rounded-xl flex items-center justify-between">
                  <span className="text-[#D2C8BC] font-semibold flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-[#9A2CF2]" /> WebAuthn Passkey Registration
                  </span>
                  <span className="text-[10px] font-mono bg-[#731BB8]/30 text-[#9A2CF2] px-2 py-0.5 rounded">HARDWARE</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* SECTION 3: FEATURES */}
      <section id="features" className="py-20 bg-[#2B103D]/60 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-[#9A2CF2] uppercase tracking-widest">CORE CAPABILITIES</span>
            <h2 className="text-3xl font-extrabold text-[#D2C8BC]">Complete Beneficiary Verification Workflow</h2>
            <p className="text-sm text-[#8D89AF]">Built for end-to-end production security with complete audit compliance.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-6 border border-white/10 space-y-4 glass-card-hover">
              <div className="p-3 bg-[#731BB8]/30 w-fit rounded-xl border border-[#9A2CF2]/40 text-[#9A2CF2]">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#D2C8BC]">Deep Email Existence Validation</h3>
              <p className="text-xs text-[#8D89AF] leading-relaxed">
                Checks email syntax, performs live DNS MX record resolution, detects disposable domains, and verifies deliverability before any invitation is sent.
              </p>
            </div>

            <div className="glass-card p-6 border border-white/10 space-y-4 glass-card-hover">
              <div className="p-3 bg-[#731BB8]/30 w-fit rounded-xl border border-[#9A2CF2]/40 text-[#9A2CF2]">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#D2C8BC]">Cryptographic 24h Tokens</h3>
              <p className="text-xs text-[#8D89AF] leading-relaxed">
                Random cryptographically secure token generation stored as SHA-256 hashes in MongoDB. One-time use links with 24-hour expiration enforcing owner resend rules.
              </p>
            </div>

            <div className="glass-card p-6 border border-white/10 space-y-4 glass-card-hover">
              <div className="p-3 bg-[#731BB8]/30 w-fit rounded-xl border border-[#9A2CF2]/40 text-[#9A2CF2]">
                <Fingerprint className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#D2C8BC]">Passkey (WebAuthn) ONLY</h3>
              <p className="text-xs text-[#8D89AF] leading-relaxed">
                Beneficiaries register using Touch ID, Face ID, or Security Keys. No password requested. Automatically links account to beneficiary invitation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: HOW IT WORKS TIMELINE */}
      <section id="timeline" className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-[#9A2CF2] uppercase tracking-widest">STEP-BY-STEP FLOW</span>
          <h2 className="text-3xl font-extrabold text-[#D2C8BC]">How Beneficiary Verification Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '01', title: 'Owner Input & MX Check', desc: 'Owner inputs details. System validates domain MX records & deliverability.' },
            { step: '02', title: 'Nodemailer HTML Sent', desc: 'Cryptographic token generated. Professional HTML email dispatched to beneficiary.' },
            { step: '03', title: 'Beneficiary Response', desc: 'Beneficiary opens signed URL, reviews terms, and selects Accept or Decline.' },
            { step: '04', title: 'Passkey Auth & Verification', desc: 'Beneficiary registers Passkey. System records IP, device & updates status to Verified.' }
          ].map((item, idx) => (
            <div key={idx} className="glass-card p-6 border border-white/10 space-y-3 relative">
              <span className="text-3xl font-black text-[#731BB8] font-mono">{item.step}</span>
              <h4 className="text-base font-bold text-[#D2C8BC]">{item.title}</h4>
              <p className="text-xs text-[#8D89AF] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8: PASSKEY WEBAUTHN SECTION */}
      <section id="passkey" className="py-20 bg-[#2B103D]/60 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold text-[#9A2CF2] uppercase tracking-widest">FIDO2 WEBAUTHN STANDARD</span>
            <h2 className="text-3xl font-extrabold text-[#D2C8BC]">Zero Passwords. Maximum Cryptographic Security.</h2>
            <p className="text-sm text-[#8D89AF] leading-relaxed">
              Traditional passwords present significant risk for estate planning. Digital Will AI mandates Passkeys for all beneficiaries, ensuring that account access is tied directly to physical biometric authenticators or hardware keys.
            </p>
            <ul className="space-y-3 text-xs text-[#D2C8BC]">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#9A2CF2]" /> Phishing-resistant WebAuthn challenge/response exchange
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#9A2CF2]" /> Automatic account linking upon successful WebAuthn verification
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#9A2CF2]" /> Hardware key backup & platform passkey synchronization
              </li>
            </ul>
          </div>

          <div className="glass-card p-8 border border-[#9A2CF2]/30 text-center space-y-6 bg-[#221B2A]">
            <Fingerprint className="w-16 h-16 text-[#9A2CF2] mx-auto animate-bounce" />
            <h3 className="text-xl font-bold text-[#D2C8BC]">Try Passkey Authentication Protocol</h3>
            <button 
              onClick={onGoToDashboard}
              className="px-6 py-3.5 btn-primary text-xs font-bold"
            >
              Open Dashboard to Test Passkeys
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 12: FAQS */}
      <section id="faqs" className="py-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-16 space-y-3">
          <span className="text-xs font-bold text-[#9A2CF2] uppercase tracking-widest">QUESTIONS & ANSWERS</span>
          <h2 className="text-3xl font-extrabold text-[#D2C8BC]">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="glass-card border border-white/10 overflow-hidden transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-semibold text-sm text-[#D2C8BC] flex items-center justify-between hover:text-white"
              >
                <span>{faq.q}</span>
                <ChevronRight className={`w-4 h-4 text-[#9A2CF2] transition-transform ${activeFaq === idx ? 'rotate-90' : ''}`} />
              </button>

              {activeFaq === idx && (
                <div className="p-5 pt-0 text-xs text-[#8D89AF] leading-relaxed border-t border-white/5 bg-[#221B2A]/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 14: FOOTER */}
      <Footer />
    </div>
  );
}
