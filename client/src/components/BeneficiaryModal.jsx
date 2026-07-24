import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, HeartHandshake, ShieldCheck, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

export function BeneficiaryModal({ isOpen, onClose, onSuccess, currentUser }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const relationships = ['Spouse', 'Child', 'Parent', 'Sibling', 'Legal Guardian', 'Executor / Attorney', 'Close Relative', 'Trusted Friend'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessResult(null);

    if (!formData.name || !formData.email || !formData.relationship) {
      setErrorMessage('Please fill in all required fields (Name, Email, Relationship).');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          ownerName: currentUser?.name || currentUser?.fullName || 'Vault Owner'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || 'Unable to add beneficiary. Please check email address.');
        setLoading(false);
        return;
      }

      setSuccessResult(data);
      setLoading(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMessage('Unable to process your request. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', phone: '', relationship: '' });
    setErrorMessage('');
    setSuccessResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-xl p-8 glass-card border border-[#9A2CF2]/30 relative shadow-2xl bg-[#2B103D]/95"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-6 right-6 p-2 text-[#8D89AF] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#731BB8]/30 rounded-2xl border border-[#9A2CF2]/50 text-[#9A2CF2]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#D2C8BC]">Add Beneficiary / Nominee</h2>
              <p className="text-sm text-[#8D89AF]">Enter beneficiary details for digital vault nomination.</p>
            </div>
          </div>

          {successResult ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-4">
                <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
                <h3 className="text-xl font-bold text-emerald-300">Invitation Sent Successfully</h3>
                <p className="text-sm text-[#D2C8BC] leading-relaxed">
                  A secure verification email has been sent to <strong className="text-white">{formData.email}</strong>.
                </p>
                <p className="text-xs text-[#8D89AF]">
                  Please ask the nominee to check their inbox. The invitation link expires in 24 hours.
                </p>
              </div>

              <button onClick={handleClose} className="w-full py-3.5 btn-primary text-sm font-bold">
                Done & Return to Dashboard
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Validation Error</span>
                    {errorMessage}
                  </div>
                </motion.div>
              )}

              {/* Beneficiary Name */}
              <div>
                <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                  Beneficiary Full Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Email Address <span className="text-rose-400">*</span></span>
                  <span className="text-[#9A2CF2] text-[11px] font-normal">Domain & MX Verification</span>
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="Enter valid email address"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Phone & Relationship */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Relationship <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <HeartHandshake className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                    <select
                      name="relationship"
                      required
                      value={formData.relationship}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm appearance-none"
                    >
                      <option value="" disabled className="bg-[#221B2A] text-[#8D89AF]">
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
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-1/3 py-3 px-4 bg-white/5 hover:bg-white/10 text-[#8D89AF] font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 px-4 btn-primary text-sm flex items-center justify-center gap-2 font-bold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Verifying Email & Domain...
                    </>
                  ) : (
                    <>Validate & Send Invitation</>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
