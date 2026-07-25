import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, RefreshCw, Mail, Phone, ShieldAlert, Clock, 
  Trash2, Edit3, Eye, AlertTriangle, CheckCircle, X, Loader2, ShieldCheck 
} from 'lucide-react';
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

  // Delete state
  const [deleteModalBeneficiary, setDeleteModalBeneficiary] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // View / Edit state
  const [viewModalBeneficiary, setViewModalBeneficiary] = useState(null);
  const [editModalBeneficiary, setEditModalBeneficiary] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '', relationship: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ message: '', type: '' });

  const token = localStorage.getItem('token');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

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
        showToast('Invitation resent successfully.');
        fetchBeneficiaries();
      } else {
        showToast(data.message || 'Failed to resend invitation.', 'error');
      }
    } catch (err) {
      showToast('Unable to resend invitation.', 'error');
    }
    setResendingId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalBeneficiary) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/beneficiaries/${deleteModalBeneficiary._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setBeneficiaries(prev => prev.filter(b => b._id !== deleteModalBeneficiary._id));
        showToast(data.message || 'Beneficiary deleted successfully.');
      } else {
        showToast(data.message || 'Failed to delete beneficiary.', 'error');
      }
    } catch (err) {
      showToast('Error deleting beneficiary.', 'error');
    }
    setDeleting(false);
    setDeleteModalBeneficiary(null);
  };

  const handleOpenEdit = (b) => {
    setEditModalBeneficiary(b);
    setEditFormData({
      name: b.name || '',
      email: b.email || '',
      phone: b.phone || '',
      relationship: b.relationship || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModalBeneficiary) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/beneficiaries/${editModalBeneficiary._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Beneficiary updated successfully.');
        setEditModalBeneficiary(null);
        fetchBeneficiaries();
      } else {
        showToast(data.message || 'Unable to update beneficiary.', 'error');
      }
    } catch (err) {
      showToast('Error updating beneficiary.', 'error');
    }
    setSavingEdit(false);
  };

  return (
    <div className="min-h-screen bg-[#221B2A] text-white">
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Page Header */}
        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#D2C8BC]">Beneficiary Verification Directory</h1>
              <p className="text-xs text-[#8D89AF]">Manage nominees, track verification status, and send invitations.</p>
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

        {/* Toast Alert */}
        <AnimatePresence>
          {toast.message && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                toast.type === 'error' 
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300' 
                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
              }`}>
              {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Beneficiaries Table */}
        <div className="glass-card border border-white/10 bg-[#2B103D]/90 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#221B2A]/80 border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Contact & Email</th>
                  <th className="p-4 font-semibold">Relationship</th>
                  <th className="p-4 font-semibold">Verification Status</th>
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
                      <td className="p-4 whitespace-nowrap text-right space-x-1.5">
                        <button
                          onClick={() => setViewModalBeneficiary(b)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-[#8D89AF] hover:text-white rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1.5 bg-[#731BB8]/20 hover:bg-[#731BB8]/40 text-[#9A2CF2] rounded-lg transition-colors"
                          title="Edit Beneficiary"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {(b.status === 'Expired' || b.status === 'Pending') && (
                          <button
                            onClick={() => handleResendInvitation(b._id)}
                            disabled={resendingId === b._id}
                            className="px-2.5 py-1 bg-[#D95F30]/20 hover:bg-[#D95F30]/40 border border-[#D95F30]/50 text-[#D2C8BC] text-[11px] font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Resend Invitation Email"
                          >
                            <RefreshCw className={`w-3 h-3 text-[#D95F30] ${resendingId === b._id ? 'animate-spin' : ''}`} />
                            Resend
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedEmergencyId(b._id)}
                          className="px-2.5 py-1 bg-[#731BB8]/30 hover:bg-[#9A2CF2]/30 border border-[#9A2CF2]/40 text-[#9A2CF2] text-[11px] font-semibold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3 h-3" /> Rules
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => setDeleteModalBeneficiary(b)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition-colors"
                          title="Delete Beneficiary"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Emergency Status Modal */}
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

        {/* Add Beneficiary Modal */}
        <BeneficiaryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchBeneficiaries}
          currentUser={currentUser}
        />

        {/* ── DELETE CONFIRMATION MODAL (Module 2) ── */}
        <AnimatePresence>
          {deleteModalBeneficiary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md p-6 glass-card border border-rose-500/40 bg-[#2B103D] text-center space-y-5"
              >
                <div className="w-14 h-14 bg-rose-500/20 rounded-2xl border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                  <AlertTriangle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#D2C8BC]">Delete Beneficiary?</h3>
                  <p className="text-xs text-[#8D89AF] leading-relaxed">
                    Are you sure you want to delete <strong className="text-white">{deleteModalBeneficiary.name}</strong> (<span className="text-white font-mono">{deleteModalBeneficiary.email}</span>)?
                  </p>
                  <p className="text-xs text-rose-300 font-semibold">
                    This will permanently remove the nominee and revoke their invitation token.
                  </p>
                </div>

                <div className="flex items-center gap-3 justify-center pt-2">
                  <button
                    onClick={() => setDeleteModalBeneficiary(null)}
                    disabled={deleting}
                    className="w-1/2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#8D89AF] text-xs font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="w-1/2 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5" /> Delete Beneficiary</>}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── VIEW BENEFICIARY MODAL (Module 2) ── */}
        <AnimatePresence>
          {viewModalBeneficiary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-lg p-6 glass-card border border-[#9A2CF2]/40 bg-[#2B103D] relative space-y-5"
              >
                <button
                  onClick={() => setViewModalBeneficiary(null)}
                  className="absolute top-5 right-5 p-2 text-[#8D89AF] hover:text-white rounded-xl hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#731BB8]/30 rounded-2xl border border-[#9A2CF2]/40 text-[#9A2CF2]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#D2C8BC]">{viewModalBeneficiary.name}</h3>
                    <p className="text-xs text-[#8D89AF]">Beneficiary Directory Profile & Verification Status</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-[#221B2A] border border-white/10 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Email Address</span>
                    <span className="font-mono text-white block truncate">{viewModalBeneficiary.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Phone Number</span>
                    <span className="text-white block">{viewModalBeneficiary.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Relationship</span>
                    <span className="text-[#9A2CF2] font-semibold block">{viewModalBeneficiary.relationship}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Verification Status</span>
                    <StatusBadge status={viewModalBeneficiary.status} />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Token Expiry</span>
                    <span className="font-mono text-[#D2C8BC]">
                      {viewModalBeneficiary.tokenExpiry ? new Date(viewModalBeneficiary.tokenExpiry).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Verification Date</span>
                    <span className="font-mono text-[#D2C8BC]">
                      {viewModalBeneficiary.verifiedAt ? new Date(viewModalBeneficiary.verifiedAt).toLocaleString() : 'Pending Acceptance'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setViewModalBeneficiary(null)}
                  className="w-full py-3 btn-primary text-xs font-bold"
                >
                  Close Profile
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── EDIT BENEFICIARY MODAL (Module 2) ── */}
        <AnimatePresence>
          {editModalBeneficiary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md p-6 glass-card border border-[#9A2CF2]/40 bg-[#2B103D] relative space-y-4"
              >
                <button
                  onClick={() => setEditModalBeneficiary(null)}
                  className="absolute top-5 right-5 p-2 text-[#8D89AF] hover:text-white rounded-xl hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-[#D2C8BC]">Edit Beneficiary Details</h3>

                <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#221B2A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editFormData.email}
                      onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#221B2A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#221B2A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Relationship</label>
                    <input
                      type="text"
                      required
                      value={editFormData.relationship}
                      onChange={e => setEditFormData({ ...editFormData, relationship: e.target.value })}
                      className="w-full px-3 py-2.5 bg-[#221B2A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setEditModalBeneficiary(null)}
                      className="w-1/3 py-2.5 bg-white/5 hover:bg-white/10 text-[#8D89AF] font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="w-2/3 py-2.5 btn-primary font-bold flex items-center justify-center gap-2"
                    >
                      {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
