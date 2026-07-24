import React, { useState, useEffect } from 'react';
import { Users, UserPlus, RefreshCw, Mail, Phone, ShieldAlert, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../components/StatusBadge';
import { BeneficiaryModal } from '../components/BeneficiaryModal';
import { EmergencyStatus } from '../components/EmergencyStatus';

export function BeneficiariesPage({ currentUser }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(null);
  const [resendingId, setResendingId] = useState(null);

  const token = localStorage.getItem('token');

  const fetchBeneficiaries = async () => {
    try {
      const res = await fetch('/api/beneficiaries', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setBeneficiaries(data.beneficiaries || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBeneficiaries(); }, []);

  const handleResendInvitation = async (id) => {
    setResendingId(id);
    try {
      const res = await fetch(`/api/beneficiaries/resend/${id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchBeneficiaries();
      } else {
        alert(data.message || 'Failed to resend invitation.');
      }
    } catch (err) {
      console.error(err);
    }
    setResendingId(null);
  };

  return (
    <div className="min-h-screen bg-[#221B2A] text-white">
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#D2C8BC]">Beneficiaries</h1>
              <p className="text-xs text-[#8D89AF]">Manage nominees and track verification status.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={fetchBeneficiaries}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-[#8D89AF] flex items-center gap-2 transition-colors border border-white/10">
              <RefreshCw className="w-3.5 h-3.5 text-[#9A2CF2]" /> Refresh
            </button>
            <button onClick={() => setIsModalOpen(true)}
              className="py-3 px-5 btn-primary text-sm font-bold flex items-center gap-2 shrink-0">
              <UserPlus className="w-4 h-4" /> Add Beneficiary
            </button>
          </div>
        </div>

        <div className="glass-card border border-white/10 bg-[#2B103D]/90 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#221B2A]/80 border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Contact</th>
                  <th className="p-4 font-semibold">Relationship</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Token Expiry</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan="6" className="p-8 text-center text-[#8D89AF]">Loading beneficiaries...</td></tr>
                ) : beneficiaries.length === 0 ? (
                  <tr><td colSpan="6" className="p-12 text-center text-[#8D89AF] text-sm font-medium">No beneficiaries added yet.</td></tr>
                ) : (
                  beneficiaries.map((b) => (
                    <tr key={b._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-[#D2C8BC] text-sm">{b.name}</div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-white flex items-center gap-1.5 font-medium">
                          <Mail className="w-3.5 h-3.5 text-[#9A2CF2]" /> {b.email}
                        </div>
                        {b.phone && (
                          <div className="text-[#8D89AF] text-[11px] flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3" /> {b.phone}
                          </div>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-[#731BB8]/20 border border-[#9A2CF2]/30 rounded-lg text-[#D2C8BC] font-medium text-xs">{b.relationship}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap"><StatusBadge status={b.status} /></td>
                      <td className="p-4 whitespace-nowrap text-[#8D89AF] font-mono text-[11px]">
                        {b.tokenExpiry ? new Date(b.tokenExpiry).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </td>
                      <td className="p-4 whitespace-nowrap text-right space-x-2">
                        {(b.status === 'Expired' || b.status === 'Pending') && (
                          <button
                            onClick={() => handleResendInvitation(b._id)}
                            disabled={resendingId === b._id}
                            className="px-3 py-1.5 bg-[#D95F30]/20 hover:bg-[#D95F30]/40 border border-[#D95F30]/50 text-[#D2C8BC] text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-[#D95F30] ${resendingId === b._id ? 'animate-spin' : ''}`} />
                            Resend
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedEmergencyId(b._id)}
                          className="px-3 py-1.5 bg-[#731BB8]/30 hover:bg-[#9A2CF2]/30 border border-[#9A2CF2]/40 text-[#9A2CF2] text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Rules
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {selectedEmergencyId && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}>
              <div className="relative">
                <button onClick={() => setSelectedEmergencyId(null)}
                  className="absolute top-4 right-4 text-xs text-[#8D89AF] hover:text-white px-3 py-1 bg-white/5 rounded-lg z-10">
                  Close
                </button>
                <EmergencyStatus
                  beneficiaryId={selectedEmergencyId}
                  beneficiaryName={beneficiaries.find(b => b._id === selectedEmergencyId)?.name || 'Nominee'}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <BeneficiaryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchBeneficiaries}
          currentUser={currentUser}
        />

      </main>
    </div>
  );
}
