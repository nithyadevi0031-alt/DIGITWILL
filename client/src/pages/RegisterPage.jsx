import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Mail, Lock, User, Phone, Eye, EyeOff, 
  ArrowRight, ShieldCheck, Sparkles, Loader2, AlertCircle, CheckCircle2, UserCheck, HeartHandshake 
} from 'lucide-react';
import { startRegistration } from '@simplewebauthn/browser';

export function RegisterPage({ onRegisterSuccess, onGoToLogin }) {
  const [role, setRole] = useState('owner');
  
  // React state initializes completely empty with required schema
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    nomineeName: '',
    nomineeEmail: '',
    relationship: '',
    usePasskey: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const relationships = ['Spouse', 'Child', 'Parent', 'Sibling', 'Legal Guardian', 'Executor / Attorney', 'Close Relative', 'Trusted Friend'];

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Please fill in all required fields (Full Name, Email, Password).');
      setLoading(false);
      return;
    }

    try {
      // 1. Submit Registration & Email Existence / MX Validation
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role,
          usePasskey: formData.usePasskey
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Unable to register. Please check email address.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Do NOT auto-login. User must verify email first.

    } catch (err) {
      setError('Unable to process your request. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#221B2A] text-white flex flex-col justify-between selection:bg-[#9A2CF2] selection:text-white relative overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-[#731BB8]/30 via-[#9A2CF2]/20 to-transparent rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#32004A]/50 rounded-full blur-[100px] pointer-events-none" />

      {/* HEADER */}
      <header className="px-8 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-base font-black text-[#D2C8BC] tracking-wider">
            DIGITAL WILL <span className="text-[#9A2CF2]">AI</span>
          </span>
        </div>

        <button
          onClick={onGoToLogin}
          className="text-xs font-bold text-[#9A2CF2] hover:underline"
        >
          Already have an account? Sign In
        </button>
      </header>

      {/* MAIN REGISTRATION CARD */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl glass-card p-8 border border-[#9A2CF2]/40 bg-[#2B103D]/95 shadow-2xl relative"
        >
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#731BB8]/30 border border-[#9A2CF2]/40 rounded-full text-xs font-semibold text-[#9A2CF2]">
              <Sparkles className="w-3.5 h-3.5" /> ACCOUNT REGISTRATION & VAULT SETUP
            </div>
            <h2 className="text-2xl font-bold text-[#D2C8BC]">Register Digital Will Account</h2>
            <p className="text-xs text-[#8D89AF]">Real-time MX domain verification & zero hardcoded demo data.</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#221B2A] rounded-xl border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => setRole('owner')}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                role === 'owner'
                  ? 'bg-gradient-to-r from-[#731BB8] to-[#9A2CF2] text-white shadow-md'
                  : 'text-[#8D89AF] hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Vault Owner Account
            </button>
            <button
              type="button"
              onClick={() => setRole('beneficiary')}
              className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                role === 'beneficiary'
                  ? 'bg-gradient-to-r from-[#731BB8] to-[#9A2CF2] text-white shadow-md'
                  : 'text-[#8D89AF] hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" /> Nominee / Beneficiary
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span className="font-semibold block">Validation Error</span>
                {error}
              </div>
            </motion.div>
          )}

          {/* Success Message */}
          {success ? (
            <div className="p-6 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-center space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-emerald-300">Registration Successful</h3>
              <p className="text-sm text-[#D2C8BC] leading-relaxed">
                A verification email has been sent to your registered email address.
              </p>
              <p className="text-xs text-[#8D89AF]">
                Please verify your email before logging in.
              </p>
              <button
                onClick={onGoToLogin}
                className="mt-4 py-3 px-6 btn-primary text-sm font-bold inline-flex items-center gap-2"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="text-xs font-bold text-[#D2C8BC] border-b border-white/10 pb-2">
                1. Account Details
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                    <input
                      type="text"
                      name="fullName"
                      required
                      placeholder="Enter full name"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Phone & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-11 pr-11 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[#8D89AF] hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Initial Nominee Details (Optional) */}
              <div className="text-xs font-bold text-[#D2C8BC] border-b border-white/10 pb-2 pt-2">
                2. Primary Nominee Details (Optional)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                    Nominee Name
                  </label>
                  <input
                    type="text"
                    name="nomineeName"
                    placeholder="Enter nominee name"
                    value={formData.nomineeName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                    Nominee Email
                  </label>
                  <input
                    type="email"
                    name="nomineeEmail"
                    placeholder="Enter nominee email"
                    value={formData.nomineeEmail}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                    Relationship
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm appearance-none"
                  >
                    <option value="" className="bg-[#221B2A] text-[#8D89AF]">
                      Select relationship
                    </option>
                    {relationships.map((rel) => (
                      <option key={rel} value={rel} className="bg-[#221B2A] text-white">
                        {rel}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 btn-primary text-sm font-bold flex items-center justify-center gap-2 group mt-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    Verifying Email & Creating Account...
                  </>
                ) : (
                  <>
                    Create Vault Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Link */}
          <div className="mt-6 pt-4 border-t border-white/10 text-center text-xs text-[#8D89AF]">
            Already registered?{' '}
            <button onClick={onGoToLogin} className="text-[#9A2CF2] font-semibold hover:underline">
              Sign In here
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="py-4 text-center text-xs text-[#8D89AF]">
        © 2026 Digital Will AI • Luxury Cyber Security Vault
      </footer>
    </div>
  );
}
