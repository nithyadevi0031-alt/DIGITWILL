import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, User, Calendar, MapPin, UserCheck, MessageSquare, 
  Save, Loader2, AlertCircle, CheckCircle, Edit3, Trash2, Mail, Phone, Plus, Percent, ShieldCheck, Tag, Eye, X 
} from 'lucide-react';

export function CreateWillPage({ currentUser }) {
  const [formData, setFormData] = useState({
    willTitle: '',
    fullName: '',
    dob: '',
    address: '',
    executorName: '',
    specialInstructions: ''
  });

  // Beneficiaries allocation state (Module 6)
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: '',
    beneficiaryEmail: '',
    phone: '',
    relationship: 'Family Member',
    assignedAssets: '',
    percentage: '100%',
    notes: ''
  });

  const [availableAssets, setAvailableAssets] = useState([]);
  const [availableNominees, setAvailableNominees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wills, setWills] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [previewWill, setPreviewWill] = useState(null);

  const token = localStorage.getItem('token');

  const fetchWills = async () => {
    try {
      const res = await fetch('/api/wills', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setWills(data.wills || []);
    } catch (err) {
      console.error(err);
    }
    setFetching(false);
  };

  const fetchAssetsAndNominees = async () => {
    try {
      const [astRes, nomRes] = await Promise.all([
        fetch('/api/assets', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/beneficiaries', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const astData = await astRes.json();
      const nomData = await nomRes.json();
      setAvailableAssets(astData.assets || []);
      setAvailableNominees(nomData.beneficiaries || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    fetchWills(); 
    fetchAssetsAndNominees(); 
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleNomineeSelect = (e) => {
    const selectedEmail = e.target.value;
    const found = availableNominees.find(n => n.email === selectedEmail || n.name === selectedEmail);
    if (found) {
      setNewBeneficiary(prev => ({
        ...prev,
        name: found.name,
        beneficiaryEmail: found.email,
        phone: found.phone || '',
        relationship: found.relationship || 'Designated Nominee'
      }));
    }
  };

  const handleAddBeneficiary = () => {
    if (!newBeneficiary.name || !newBeneficiary.beneficiaryEmail) {
      setError('Nominee Name and Email Address are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newBeneficiary.beneficiaryEmail.trim())) {
      setError('Please provide a valid nominee email address.');
      return;
    }

    setBeneficiaries(prev => [...prev, { ...newBeneficiary }]);
    setNewBeneficiary({
      name: '',
      beneficiaryEmail: '',
      phone: '',
      relationship: 'Family Member',
      assignedAssets: '',
      percentage: '100%',
      notes: ''
    });
    setError('');
  };

  const handleRemoveBeneficiary = (index) => {
    setBeneficiaries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.willTitle || !formData.fullName || !formData.dob || !formData.address || !formData.executorName) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const url = editingId ? `/api/wills/${editingId}` : '/api/wills/create';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          beneficiaries
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Unable to save Will. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(editingId ? 'Will updated successfully.' : 'Will created successfully and nominee invitations dispatched.');
      setFormData({ willTitle: '', fullName: '', dob: '', address: '', executorName: '', specialInstructions: '' });
      setBeneficiaries([]);
      setEditingId(null);
      fetchWills();
    } catch (err) {
      setError('Unable to process your request. Please try again.');
    }
    setLoading(false);
  };

  const handleEdit = (will) => {
    setEditingId(will._id);
    setFormData({
      willTitle: will.willTitle || '',
      fullName: will.fullName || '',
      dob: will.dob || '',
      address: will.address || '',
      executorName: will.executorName || '',
      specialInstructions: will.specialInstructions || ''
    });
    setBeneficiaries(will.beneficiaries || []);
    setSuccess('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Will?')) return;
    try {
      await fetch(`/api/wills/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchWills();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#221B2A] text-white">
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Page Header */}
        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#D2C8BC]">
                {editingId ? 'Edit Digital Will' : 'Create Digital Will'}
              </h1>
              <p className="text-xs text-[#8D89AF]">
                Create & customize legal Digital Will, assign beneficiary emails, percentages, and asset allocations.
              </p>
            </div>
          </div>
        </div>

        {/* Success / Error Messages */}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            {error}
          </motion.div>
        )}

        {/* Will Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-6 text-xs">
          
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-base font-bold text-[#D2C8BC]">1. General Will Details</h3>
          </div>

          <div>
            <label className="block font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
              Will Title <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8D89AF]" />
              <input type="text" name="willTitle" required placeholder="e.g. Primary Estate Legacy Will" value={formData.willTitle} onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                <input type="text" name="fullName" required placeholder="Enter full legal name" value={formData.fullName} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] text-xs" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                Date of Birth <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                <input type="date" name="dob" required value={formData.dob} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2] text-xs" />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
              Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8D89AF]" />
              <textarea name="address" required placeholder="Enter primary residential address" value={formData.address} onChange={handleChange} rows={2}
                className="w-full pl-10 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] text-xs resize-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                Executor Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                <input type="text" name="executorName" required placeholder="Enter designated executor name" value={formData.executorName} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] text-xs" />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                Special Instructions / Notes
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                <input type="text" name="specialInstructions" placeholder="Special conditions or notes" value={formData.specialInstructions} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] text-xs" />
              </div>
            </div>
          </div>

          {/* ── 2. BENEFICIARIES ALLOCATION (Module 6 Requirement) ── */}
          <div className="border-t border-white/10 pt-5 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-[#D2C8BC]">2. Assign Beneficiaries & Asset Allocation</h3>
                <p className="text-[#8D89AF] text-[11px]">Include nominee email address, phone, relationship, and assigned asset percentage.</p>
              </div>
            </div>

            {/* BENEFICIARY ADD FORM */}
            <div className="p-4 bg-[#221B2A] border border-white/10 rounded-xl space-y-3">
              {availableNominees.length > 0 && (
                <div className="mb-2">
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Quick Select Verified Nominee</label>
                  <select onChange={handleNomineeSelect} defaultValue="" className="w-full px-3 py-2 bg-[#2B103D] border border-white/10 rounded-lg text-white">
                    <option value="" disabled>Select existing beneficiary</option>
                    {availableNominees.map(n => <option key={n._id} value={n.email}>{n.name} ({n.email})</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Nominee Name <span className="text-rose-400">*</span></label>
                  <input type="text" placeholder="Full name" value={newBeneficiary.name} onChange={e => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2B103D] border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Email Address <span className="text-rose-400">*</span></label>
                  <input type="email" placeholder="nominee@domain.com" value={newBeneficiary.beneficiaryEmail} onChange={e => setNewBeneficiary({ ...newBeneficiary, beneficiaryEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2B103D] border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Phone Number</label>
                  <input type="text" placeholder="+1234567890" value={newBeneficiary.phone} onChange={e => setNewBeneficiary({ ...newBeneficiary, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2B103D] border border-white/10 rounded-lg text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Relationship</label>
                  <input type="text" placeholder="e.g. Spouse, Son, Daughter" value={newBeneficiary.relationship} onChange={e => setNewBeneficiary({ ...newBeneficiary, relationship: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2B103D] border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Assigned Assets</label>
                  <select value={newBeneficiary.assignedAssets} onChange={e => setNewBeneficiary({ ...newBeneficiary, assignedAssets: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2B103D] border border-white/10 rounded-lg text-white">
                    <option value="">Select asset</option>
                    {availableAssets.map(a => <option key={a._id} value={a.assetName}>{a.assetName} ({a.assetType})</option>)}
                    <option value="All Vault Assets">All Vault Assets (Entire Estate)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Percentage (%)</label>
                  <input type="text" placeholder="e.g. 50% or 100%" value={newBeneficiary.percentage} onChange={e => setNewBeneficiary({ ...newBeneficiary, percentage: e.target.value })}
                    className="w-full px-3 py-2 bg-[#2B103D] border border-white/10 rounded-lg text-white" />
                </div>
              </div>

              <button type="button" onClick={handleAddBeneficiary}
                className="py-2 px-4 bg-[#731BB8] hover:bg-[#9A2CF2] text-white font-bold rounded-lg transition-colors flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Add Nominee to Will
              </button>
            </div>

            {/* ADDED BENEFICIARIES LIST */}
            {beneficiaries.length > 0 && (
              <div className="space-y-2">
                <span className="text-[#8D89AF] uppercase font-semibold tracking-wider text-[10px]">Assigned Nominees ({beneficiaries.length})</span>
                <div className="divide-y divide-white/5 bg-[#221B2A] rounded-xl border border-white/10 overflow-hidden">
                  {beneficiaries.map((b, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-white text-xs">{b.name} <span className="text-[#9A2CF2] font-normal">({b.relationship})</span></div>
                        <div className="text-[11px] text-[#8D89AF] font-mono">{b.beneficiaryEmail} · {b.phone || 'No phone'}</div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">Asset: {b.assignedAssets || 'All Estate'} ({b.percentage || '100%'})</div>
                      </div>
                      <button type="button" onClick={() => handleRemoveBeneficiary(idx)} className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData({ willTitle: '', fullName: '', dob: '', address: '', executorName: '', specialInstructions: '' }); setBeneficiaries([]); setError(''); setSuccess(''); }}
                className="w-1/3 py-3 px-4 bg-white/5 hover:bg-white/10 text-[#8D89AF] font-semibold rounded-xl text-xs transition-colors">
                Cancel Edit
              </button>
            )}
            <button type="submit" disabled={loading}
              className={`${editingId ? 'w-2/3' : 'w-full'} py-3.5 btn-primary text-xs flex items-center justify-center gap-2 font-bold`}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving & Dispatched Invitations...</>
              ) : (
                <><Save className="w-4 h-4" /> {editingId ? 'Update Will' : 'Create & Save Will'}</>
              )}
            </button>
          </div>
        </form>

        {/* Saved Wills List */}
        <div className="glass-card border border-white/10 bg-[#2B103D]/90 overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-base font-bold text-[#D2C8BC]">Your Digital Wills</h3>
            <p className="text-xs text-[#8D89AF]">Click Preview to inspect Digital Will Release Conditions and Beneficiary Details.</p>
          </div>

          {fetching ? (
            <div className="p-8 text-center text-[#8D89AF] text-xs">Loading wills...</div>
          ) : wills.length === 0 ? (
            <div className="p-12 text-center text-[#8D89AF] text-xs font-medium">No wills created yet.</div>
          ) : (
            <div className="divide-y divide-white/5 text-xs">
              {wills.map((w) => (
                <div key={w._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/5 transition-colors">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#D2C8BC]">{w.willTitle}</h4>
                    <p className="text-xs text-[#8D89AF]">{w.fullName} · DOB: {w.dob} · Executor: {w.executorName}</p>
                    <p className="text-[10px] text-[#9A2CF2]">Beneficiaries Assigned: {(w.beneficiaries || []).length} Nominees</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setPreviewWill(w)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>
                    <button onClick={() => handleEdit(w)}
                      className="px-3 py-1.5 bg-[#731BB8]/30 hover:bg-[#9A2CF2]/30 border border-[#9A2CF2]/40 text-[#9A2CF2] text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button onClick={() => handleDelete(w._id)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── DIGITAL WILL PREVIEW MODAL (Module 7 Requirement) ── */}
        <AnimatePresence>
          {previewWill && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-2xl p-6 glass-card border border-[#9A2CF2]/40 bg-[#2B103D] relative space-y-5 max-h-[90vh] overflow-y-auto">
                
                <button onClick={() => setPreviewWill(null)} className="absolute top-5 right-5 p-2 text-[#8D89AF] hover:text-white rounded-xl hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="p-3 bg-[#731BB8]/30 rounded-2xl border border-[#9A2CF2]/40 text-[#9A2CF2]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#D2C8BC]">{previewWill.willTitle}</h3>
                    <p className="text-xs text-[#8D89AF]">Digital Will Preview & Release Condition Specifications</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-[#221B2A] border border-white/10 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Testator / Owner</span>
                    <span className="text-white font-bold">{previewWill.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Designated Executor</span>
                    <span className="text-[#9A2CF2] font-semibold">{previewWill.executorName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Date of Birth</span>
                    <span className="text-white font-mono">{previewWill.dob}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Address</span>
                    <span className="text-[#D2C8BC] truncate block">{previewWill.address}</span>
                  </div>
                </div>

                {/* DIGITAL WILL PREVIEW - BENEFICIARY LIST (Module 7 Requirement) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#8D89AF] uppercase tracking-wider">Assigned Beneficiaries ({previewWill.beneficiaries?.length || 0})</h4>
                  {(!previewWill.beneficiaries || previewWill.beneficiaries.length === 0) ? (
                    <p className="text-xs text-[#8D89AF] italic">No specific beneficiaries itemized in this Digital Will record.</p>
                  ) : (
                    <div className="space-y-3">
                      {previewWill.beneficiaries.map((b, idx) => (
                        <div key={idx} className="p-4 bg-[#221B2A] border border-white/10 rounded-xl space-y-2 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-white text-sm">{b.name}</div>
                              <div className="text-[#8D89AF] font-mono text-[11px]">{b.beneficiaryEmail} · {b.phone || 'N/A'}</div>
                            </div>
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                              {b.status || 'Assigned'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div><span className="text-[#8D89AF]">Relationship:</span> <span className="text-white font-medium">{b.relationship}</span></div>
                            <div><span className="text-[#8D89AF]">Percentage:</span> <span className="text-[#9A2CF2] font-bold">{b.percentage || '100%'}</span></div>
                            <div><span className="text-[#8D89AF]">Assigned Assets:</span> <span className="text-white">{b.assignedAssets?.join(', ') || 'All Vault Assets'}</span></div>
                            <div><span className="text-[#8D89AF]">Release Conditions:</span> <span className="text-[#D2C8BC]">{b.releaseConditions || 'Emergency verification'}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => setPreviewWill(null)} className="w-full py-3 btn-primary text-xs font-bold">Close Preview</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
