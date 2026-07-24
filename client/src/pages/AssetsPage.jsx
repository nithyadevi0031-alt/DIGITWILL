import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Landmark, Plus, Edit3, Trash2, Loader2, AlertCircle, CheckCircle, 
  DollarSign, Tag, UserCheck, X 
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

  const [formData, setFormData] = useState({
    assetName: '',
    assetType: '',
    estimatedValue: '',
    assignedBeneficiary: ''
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

  const resetForm = () => {
    setFormData({ assetName: '', assetType: '', estimatedValue: '', assignedBeneficiary: '' });
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
      setError('All fields are required.');
      setSaving(false);
      return;
    }

    try {
      const url = editingId ? `/api/assets/${editingId}` : '/api/assets';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
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
      assignedBeneficiary: asset.assignedBeneficiary || ''
    });
    setShowForm(true);
    setSuccess('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess('Asset deleted successfully.');
      fetchAssets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#221B2A] text-white">
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Page Header */}
        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#D2C8BC]">Asset Management</h1>
              <p className="text-xs text-[#8D89AF]">Manage your digital and physical assets for will distribution.</p>
            </div>
          </div>

          <button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ assetName: '', assetType: '', estimatedValue: '', assignedBeneficiary: '' }); }}
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">Asset Name <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Tag className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                    <input type="text" name="assetName" required placeholder="Enter asset name" value={formData.assetName} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">Asset Type <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Landmark className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                    <select name="assetType" required value={formData.assetType} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm appearance-none">
                      <option value="" disabled className="bg-[#221B2A] text-[#8D89AF]">Select asset type</option>
                      {ASSET_TYPES.map(t => <option key={t} value={t} className="bg-[#221B2A] text-white">{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">Estimated Value <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <DollarSign className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                    <input type="text" name="estimatedValue" required placeholder="Enter estimated value" value={formData.estimatedValue} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">Assigned Beneficiary <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <UserCheck className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                    <select name="assignedBeneficiary" required value={formData.assignedBeneficiary} onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm appearance-none">
                      <option value="" disabled className="bg-[#221B2A] text-[#8D89AF]">Select beneficiary</option>
                      {beneficiaries.map(b => <option key={b._id} value={b.name} className="bg-[#221B2A] text-white">{b.name} ({b.email})</option>)}
                      <option value="Other" className="bg-[#221B2A] text-white">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={resetForm} className="w-1/3 py-3 bg-white/5 hover:bg-white/10 text-[#8D89AF] font-semibold rounded-xl text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="w-2/3 py-3 btn-primary text-sm flex items-center justify-center gap-2 font-bold">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <>{editingId ? 'Update Asset' : 'Add Asset'}</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Assets Table */}
        <div className="glass-card border border-white/10 bg-[#2B103D]/90 overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-base font-bold text-[#D2C8BC]">Your Assets</h3>
            <p className="text-xs text-[#8D89AF]">All registered assets for will distribution.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#221B2A]/80 border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
                  <th className="p-4 font-semibold">Asset Name</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Estimated Value</th>
                  <th className="p-4 font-semibold">Assigned Beneficiary</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan="5" className="p-8 text-center text-[#8D89AF]">Loading assets...</td></tr>
                ) : assets.length === 0 ? (
                  <tr><td colSpan="5" className="p-12 text-center text-[#8D89AF] text-sm font-medium">No assets added yet.</td></tr>
                ) : (
                  assets.map(a => (
                    <tr key={a._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 whitespace-nowrap font-bold text-[#D2C8BC] text-sm">{a.assetName}</td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-[#731BB8]/20 border border-[#9A2CF2]/30 rounded-lg text-[#D2C8BC] font-medium text-xs">{a.assetType}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-white font-medium">{a.estimatedValue}</td>
                      <td className="p-4 whitespace-nowrap text-[#8D89AF]">{a.assignedBeneficiary}</td>
                      <td className="p-4 whitespace-nowrap text-right space-x-2">
                        <button onClick={() => handleEdit(a)} className="px-3 py-1.5 bg-[#731BB8]/30 hover:bg-[#9A2CF2]/30 border border-[#9A2CF2]/40 text-[#9A2CF2] text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDelete(a._id)} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
