import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, UserPlus, ShieldAlert, ShieldCheck, RefreshCw, Mail, Phone, 
  Clock, AlertCircle, Cpu 
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { BeneficiaryModal } from '../components/BeneficiaryModal';
import { AuditLogTable } from '../components/AuditLogTable';
import { EmergencyStatus } from '../components/EmergencyStatus';

export function DashboardPage({ currentUser, onGoToLanding }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(null);
  const [resendingId, setResendingId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [bRes, aRes, nRes] = await Promise.all([
        fetch('/api/beneficiaries'),
        fetch('/api/audit-logs'),
        fetch('/api/notifications')
      ]);

      const bData = await bRes.json();
      const aData = await aRes.json();
      const nData = await nRes.json();

      setBeneficiaries(bData.beneficiaries || []);
      setAuditLogs(aData.logs || []);
      setNotifications(nData.notifications || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching real DB data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleResendInvitation = async (id) => {
    setResendingId(id);
    try {
      const res = await fetch(`/api/beneficiaries/resend/${id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchDashboardData();
      } else {
        alert(data.message || 'Failed to resend invitation');
      }
    } catch (err) {
      console.error(err);
    }
    setResendingId(null);
  };

  const verifiedCount = beneficiaries.filter(b => b.status === 'Verified' || b.status === 'Accepted').length;
  const pendingCount = beneficiaries.filter(b => b.status === 'Pending').length;
  const expiredCount = beneficiaries.filter(b => b.status === 'Expired').length;

  return (
    <div className="min-h-screen bg-[#221B2A] text-white">
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-[#731BB8]/30 border border-[#9A2CF2]/40 rounded-full text-xs font-mono text-[#9A2CF2]">
                {currentUser?.email ? `ACCOUNT: ${currentUser.email}` : 'VAULT CONTROL CENTER'}
              </span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Real-time Sync Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#D2C8BC]">
              {currentUser?.name ? `${currentUser.name}'s Vault Dashboard` : 'Vault Control Center'}
            </h1>
            <p className="text-xs text-[#8D89AF] mt-1">Manage nominees, track 24h link expirations, evaluate emergency access policies, and audit WebAuthn passkeys.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="py-3.5 px-6 btn-primary text-sm font-bold flex items-center gap-2.5 shrink-0"
          >
            <UserPlus className="w-4 h-4 text-white" />
            Nominate New Beneficiary
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-5 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-[#8D89AF]">
              <span className="text-xs uppercase font-semibold">Total Nominees</span>
              <Users className="w-5 h-5 text-[#9A2CF2]" />
            </div>
            <div className="text-3xl font-black text-[#D2C8BC]">{beneficiaries.length}</div>
            <span className="text-[11px] text-[#8D89AF]">
              {beneficiaries.length === 0 ? 'No vault created.' : 'Active estate designations'}
            </span>
          </div>

          <div className="glass-card p-5 border border-emerald-500/30 bg-emerald-500/5 space-y-2">
            <div className="flex justify-between items-center text-emerald-300">
              <span className="text-xs uppercase font-semibold">Verified Beneficiaries</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400">{verifiedCount}</div>
            <span className="text-[11px] text-emerald-300/70">Passkey & identity verified</span>
          </div>

          <div className="glass-card p-5 border border-amber-500/30 bg-amber-500/5 space-y-2">
            <div className="flex justify-between items-center text-amber-300">
              <span className="text-xs uppercase font-semibold">Pending Invitations</span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-300">{pendingCount}</div>
            <span className="text-[11px] text-amber-300/70">Awaiting 24h link response</span>
          </div>

          <div className="glass-card p-5 border border-[#D95F30]/30 bg-[#D95F30]/5 space-y-2">
            <div className="flex justify-between items-center text-[#D2C8BC]">
              <span className="text-xs uppercase font-semibold">Expired Links</span>
              <AlertCircle className="w-5 h-5 text-[#D95F30]" />
            </div>
            <div className="text-3xl font-black text-[#D95F30]">{expiredCount}</div>
            <span className="text-[11px] text-[#8D89AF]">Requires owner resend</span>
          </div>
        </div>

        {/* BENEFICIARIES DIRECTORY TABLE */}
        <div className="glass-card overflow-hidden border border-white/10 bg-[#2B103D]/90">
          <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-[#D2C8BC]">Beneficiary Verification Directory</h3>
              <p className="text-xs text-[#8D89AF]">Real-time verification badges & instant 24h invitation token controls.</p>
            </div>

            <button
              onClick={fetchDashboardData}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-[#8D89AF] flex items-center gap-2 transition-colors border border-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#9A2CF2]" /> Refresh Status
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#221B2A]/80 border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
                  <th className="p-4 font-semibold">Beneficiary Name</th>
                  <th className="p-4 font-semibold">Contact Email & Phone</th>
                  <th className="p-4 font-semibold">Relationship</th>
                  <th className="p-4 font-semibold">Verification Badge</th>
                  <th className="p-4 font-semibold">Token Expiry / Sent</th>
                  <th className="p-4 font-semibold text-right">Actions Protocol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-[#8D89AF]">
                      Loading beneficiary directory...
                    </td>
                  </tr>
                ) : beneficiaries.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-[#8D89AF] text-xs font-medium">
                      No beneficiaries added yet.
                    </td>
                  </tr>
                ) : (
                  beneficiaries.map((b) => (
                    <tr key={b._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-[#D2C8BC] text-sm">{b.name}</div>
                        <div className="text-[10px] text-[#8D89AF] font-mono">ID: {b._id.substring(0, 12)}</div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="text-white flex items-center gap-1.5 font-medium">
                          <Mail className="w-3.5 h-3.5 text-[#9A2CF2]" /> {b.email}
                        </div>
                        {b.phone && (
                          <div className="text-[#8D89AF] text-[11px] flex items-center gap-1.5 mt-0.5">
                            <Phone className="w-3 h-3 text-[#8D89AF]" /> {b.phone}
                          </div>
                        )}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-[#731BB8]/20 border border-[#9A2CF2]/30 rounded-lg text-[#D2C8BC] font-medium text-xs">
                          {b.relationship}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <StatusBadge status={b.status} />
                      </td>

                      <td className="p-4 whitespace-nowrap text-[#8D89AF]">
                        <div className="font-mono text-xs">
                          {b.tokenExpiry ? new Date(b.tokenExpiry).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Consumed / N/A'}
                        </div>
                        <div className="text-[10px] text-[#8D89AF]/70">Resends: {b.resendCount || 0}</div>
                      </td>

                      <td className="p-4 whitespace-nowrap text-right space-x-2">
                        {(b.status === 'Expired' || b.status === 'Pending') && (
                          <button
                            onClick={() => handleResendInvitation(b._id)}
                            disabled={resendingId === b._id}
                            className="px-3 py-1.5 bg-[#D95F30]/20 hover:bg-[#D95F30]/40 border border-[#D95F30]/50 text-[#D2C8BC] text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-[#D95F30] ${resendingId === b._id ? 'animate-spin' : ''}`} />
                            Resend Token
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedEmergencyId(b._id)}
                          className="px-3 py-1.5 bg-[#731BB8]/30 hover:bg-[#9A2CF2]/30 border border-[#9A2CF2]/40 text-[#9A2CF2] text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" /> Emergency Rules
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* EMERGENCY RULES EVALUATION DRAWER */}
        <AnimatePresence>
          {selectedEmergencyId && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}>
              <div className="relative">
                <button
                  onClick={() => setSelectedEmergencyId(null)}
                  className="absolute top-4 right-4 text-xs text-[#8D89AF] hover:text-white px-3 py-1 bg-white/5 rounded-lg z-10"
                >
                  Close Rules Evaluator
                </button>
                <EmergencyStatus
                  beneficiaryId={selectedEmergencyId}
                  beneficiaryName={beneficiaries.find(b => b._id === selectedEmergencyId)?.name || 'Nominee'}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AUDIT LOG TABLE */}
        <AuditLogTable logs={auditLogs} />

      </main>

      {/* BENEFICIARY ADD MODAL */}
      <BeneficiaryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>
  );
}
