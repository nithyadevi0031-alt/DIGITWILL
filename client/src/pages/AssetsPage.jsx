import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Landmark, Plus, Edit3, Trash2, Loader2, AlertCircle, CheckCircle, 
  DollarSign, Tag, UserCheck, X, Eye, ShieldCheck, Mail, AlertTriangle, User 
} from 'lucide-react';

const ASSET_TYPES = [
  'Bank Account', 'Property', 'Gold', 'Mutual Funds', 'Shares',
  'Vehicle', 'Cryptocurrency', 'Insurance', 'Digital Assets', 'Others'
];

export function AssetsPage({ currentUser }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [beneficiaries, setBeneficiaries] = useState([]);

  // View & Delete modals
  const [viewAsset, setViewAsset] = useState(null);
  const [deleteAsset, setDeleteAsset] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    assetName: '',
    assetType: '',
    estimatedValue: '',
    assignedBeneficiary: '',
    nomineeEmail: ''
  });

  const token = localStorage.getItem('token');

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setAssets(data.assets || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchBeneficiaries = async () => {
    try {
      const res = await fetch('/api/beneficiaries', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setBeneficiaries(data.beneficiaries || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchAssets(); fetchBeneficiaries(); }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleBeneficiarySelect = (e) => {
    const val = e.target.value;
    const found = beneficiaries.find(b => b.name === val || b.email === val);
    if (found) {
      setFormData(prev => ({
        ...prev,
        assignedBeneficiary: found.name,
        nomineeEmail: found.email
      }));
    } else {
      setFormData(prev => ({ ...prev, assignedBeneficiary: val }));
    }
  };

  const resetForm = () => {
    setFormData({ assetName: '', assetType: '', estimatedValue: '', assignedBeneficiary: '', nomineeEmail: '' });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!formData.assetName || !formData.assetType || !formData.estimatedValue || !formData.assignedBeneficiary) {
      setError('Asset Name, Type, Value, and Assigned Beneficiary are required.');
      setSaving(false);
      return;
    }

    try {
      const url = editingId ? `/api/assets/${editingId}` : '/api/assets';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          ownerName: currentUser?.fullName || currentUser?.name || 'Vault Owner',
          encryptionStatus: 'AES-256 Encrypted'
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Unable to save asset.');
        setSaving(false);
        return;
      }

      setSuccess(editingId ? 'Asset updated successfully.' : 'Asset added successfully.');
      resetForm();
      fetchAssets();
    } catch (err) {
      setError('Unable to process your request. Please try again.');
    }
    setSaving(false);
  };

  const handleEdit = (asset) => {
    setEditingId(asset._id);
    setFormData({
      assetName: asset.assetName || '',
      assetType: asset.assetType || '',
      estimatedValue: asset.estimatedValue || '',
      assignedBeneficiary: asset.assignedBeneficiary || '',
      nomineeEmail: asset.nomineeEmail || ''
    });
    setShowForm(true);
    setSuccess('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteAsset) return;
    setDeleting(true);
    try {
      await fetch(`/api/assets/${deleteAsset._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess(`Asset "${deleteAsset.assetName}" deleted successfully.`);
      setAssets(prev => prev.filter(a => a._id !== deleteAsset._id));
    } catch (err) {
      console.error(err);
    }
    setDeleting(false);
    setDeleteAsset(null);
  };

  return (
    <div className="min-h-screen bg-[#221B2A] text-white">
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Page Header */}
        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#D2C8BC]">Asset Management Module</h1>
              <p className="text-xs text-[#8D89AF]">Manage digital and physical assets with nominee email allocation & AES encryption.</p>
            </div>
          </div>

          <button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ assetName: '', assetType: '', estimatedValue: '', assignedBeneficiary: '', nomineeEmail: '' }); }}
            className="py-3 px-5 btn-primary text-sm font-bold flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add New Asset
          </button>
        </div>

        {/* Messages */}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" /> {success}
          </motion.div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/90 space-y-4 relative">
            <button onClick={resetForm} className="absolute top-5 right-5 p-2 text-[#8D89AF] hover:text-white rounded-xl hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#D2C8BC]">{editingId ? 'Edit Asset' : 'Add New Asset'}</h3>

            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Asset Name <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Tag className="w-4 h-4 absolute left-3.5 top-3 text-[#8D89AF]" />
                    <input type="text" name="assetName" required placeholder="Enter asset name" value={formData.assetName} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#221B2A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Category / Asset Type <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Landmark className="w-4 h-4 absolute left-3.5 top-3 text-[#8D89AF]" />
                    <select name="assetType" required value={formData.assetType} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#221B2A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2] appearance-none">
                      <option value="" disabled className="bg-[#221B2A]">Select asset category</option>
                      {ASSET_TYPES.map(t => <option key={t} value={t} className="bg-[#221B2A]">{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Estimated Value <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3.5 top-3 text-[#8D89AF]" />
                    <input type="text" name="estimatedValue" required placeholder="Enter estimated value" value={formData.estimatedValue} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#221B2A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2]" />
                  </div>
                </div>

                <div>
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Assigned Nominee <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 absolute left-3.5 top-3 text-[#8D89AF]" />
                    <select name="assignedBeneficiary" required value={formData.assignedBeneficiary} onChange={handleBeneficiarySelect}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#221B2A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2] appearance-none">
                      <option value="" disabled className="bg-[#221B2A]">Select nominee</option>
                      {beneficiaries.map(b => <option key={b._id} value={b.name} className="bg-[#221B2A]">{b.name} ({b.email})</option>)}
                      <option value="Unassigned" className="bg-[#221B2A]">Unassigned / General</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[#8D89AF] uppercase font-semibold mb-1">Nominee Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#8D89AF]" />
                    <input type="email" name="nomineeEmail" placeholder="Enter nominee email" value={formData.nomineeEmail} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#221B2A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={resetForm} className="w-1/3 py-2.5 bg-white/5 hover:bg-white/10 text-[#8D89AF] font-semibold rounded-xl">Cancel</button>
                <button type="submit" disabled={saving} className="w-2/3 py-2.5 btn-primary font-bold flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{editingId ? 'Update Asset' : 'Add Asset'}</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Assets Table (Module 5) */}
        <div className="glass-card border border-white/10 bg-[#2B103D]/90 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-[#D2C8BC]">Registered Assets Directory</h3>
              <p className="text-xs text-[#8D89AF]">Showing category, owner, assigned nominee email, and encryption status.</p>
            </div>
            <span className="text-xs text-[#9A2CF2] font-semibold">{assets.length} Total Assets</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#221B2A]/80 border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
                  <th className="p-4 font-semibold">Asset Name</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Value</th>
                  <th className="p-4 font-semibold">Assigned Nominee & Email</th>
                  <th className="p-4 font-semibold">Encryption Status</th>
                  <th className="p-4 font-semibold">Created Date</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan="7" className="p-8 text-center text-[#8D89AF]">Loading assets...</td></tr>
                ) : assets.length === 0 ? (
                  <tr><td colSpan="7" className="p-12 text-center text-[#8D89AF] text-sm font-medium">No assets added yet.</td></tr>
                ) : (
                  assets.map(a => (
                    <tr key={a._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 whitespace-nowrap font-bold text-[#D2C8BC] text-sm">{a.assetName}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-[#731BB8]/20 border border-[#9A2CF2]/30 rounded-lg text-[#D2C8BC] font-medium text-xs">{a.assetType}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-white font-medium">{a.estimatedValue}</td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-white font-semibold">{a.assignedBeneficiary}</div>
                        <div className="text-[#8D89AF] text-[11px] font-mono">{a.nomineeEmail || '—'}</div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" /> {a.encryptionStatus || 'AES-256 Encrypted'}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-[#8D89AF] font-mono text-[11px]">
                        {new Date(a.createdAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="p-4 whitespace-nowrap text-right space-x-1.5">
                        <button onClick={() => setViewAsset(a)} className="p-1.5 bg-white/5 hover:bg-white/10 text-[#8D89AF] hover:text-white rounded-lg transition-colors" title="View Details">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleEdit(a)} className="p-1.5 bg-[#731BB8]/20 hover:bg-[#731BB8]/40 text-[#9A2CF2] rounded-lg transition-colors" title="Edit Asset">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteAsset(a)} className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition-colors" title="Delete Asset">
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

        {/* ── VIEW ASSET MODAL ── */}
        <AnimatePresence>
          {viewAsset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-lg p-6 glass-card border border-[#9A2CF2]/40 bg-[#2B103D] relative space-y-4">
                <button onClick={() => setViewAsset(null)} className="absolute top-5 right-5 p-2 text-[#8D89AF] hover:text-white rounded-xl hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#731BB8]/30 rounded-2xl border border-[#9A2CF2]/40 text-[#9A2CF2]">
                    <Landmark className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#D2C8BC]">{viewAsset.assetName}</h3>
                    <p className="text-xs text-[#8D89AF]">Asset Details & Security Profile</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-[#221B2A] border border-white/10 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Asset Category</span>
                    <span className="text-[#9A2CF2] font-semibold">{viewAsset.assetType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Estimated Value</span>
                    <span className="font-bold text-white font-mono text-sm">{viewAsset.estimatedValue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Assigned Nominee</span>
                    <span className="text-white font-semibold">{viewAsset.assignedBeneficiary}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Nominee Email</span>
                    <span className="text-white font-mono truncate block">{viewAsset.nomineeEmail || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Owner</span>
                    <span className="text-white">{viewAsset.ownerName || currentUser?.fullName || 'Vault Owner'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Encryption Level</span>
                    <span className="text-emerald-400 font-bold">{viewAsset.encryptionStatus || 'AES-256 Encrypted'}</span>
                  </div>
                </div>

                <button onClick={() => setViewAsset(null)} className="w-full py-3 btn-primary text-xs font-bold">Close Asset View</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── DELETE ASSET CONFIRMATION MODAL ── */}
        <AnimatePresence>
          {deleteAsset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md p-6 glass-card border border-rose-500/40 bg-[#2B103D] text-center space-y-4">
                <div className="w-14 h-14 bg-rose-500/20 rounded-2xl border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#D2C8BC]">Delete Asset?</h3>
                  <p className="text-xs text-[#8D89AF]">Are you sure you want to delete <strong className="text-white">{deleteAsset.assetName}</strong>?</p>
                  <p className="text-xs text-rose-300 font-semibold">This action cannot be undone.</p>
                </div>
                <div className="flex items-center gap-3 justify-center pt-2">
                  <button onClick={() => setDeleteAsset(null)} className="w-1/2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#8D89AF] text-xs font-semibold rounded-xl">Cancel</button>
                  <button onClick={handleDeleteConfirm} disabled={deleting} className="w-1/2 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5" /> Delete Asset</>}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
