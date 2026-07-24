import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, User, Calendar, MapPin, UserCheck, MessageSquare, 
  Save, Loader2, AlertCircle, CheckCircle, Edit3, Trash2 
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [wills, setWills] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [fetching, setFetching] = useState(true);

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

  useEffect(() => { fetchWills(); }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
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
      const url = editingId ? `/api/wills/${editingId}` : '/api/wills';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Unable to save Will. Please try again.');
        setLoading(false);
        return;
      }

      setSuccess(editingId ? 'Will updated successfully.' : 'Will created successfully.');
      setFormData({ willTitle: '', fullName: '', dob: '', address: '', executorName: '', specialInstructions: '' });
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
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Page Header */}
        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#D2C8BC]">
                {editingId ? 'Edit Will' : 'Create Will'}
              </h1>
              <p className="text-xs text-[#8D89AF]">
                {editingId ? 'Update your Digital Will details.' : 'Create your Digital Will with owner, executor, and special instructions.'}
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
        <form onSubmit={handleSubmit} className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
              Will Title <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <FileText className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
              <input type="text" name="willTitle" required placeholder="Enter will title" value={formData.willTitle} onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                <input type="text" name="fullName" required placeholder="Enter full name" value={formData.fullName} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
                Date of Birth <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                <input type="date" name="dob" required value={formData.dob} onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
              Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
              <textarea name="address" required placeholder="Enter full address" value={formData.address} onChange={handleChange} rows={2}
                className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm resize-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
              Executor Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <UserCheck className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
              <input type="text" name="executorName" required placeholder="Enter executor name" value={formData.executorName} onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">
              Special Instructions
            </label>
            <div className="relative">
              <MessageSquare className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
              <textarea name="specialInstructions" placeholder="Enter any special instructions or notes" value={formData.specialInstructions} onChange={handleChange} rows={3}
                className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white placeholder-[#8D89AF]/50 focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm resize-none" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setFormData({ willTitle: '', fullName: '', dob: '', address: '', executorName: '', specialInstructions: '' }); setError(''); setSuccess(''); }}
                className="w-1/3 py-3 px-4 bg-white/5 hover:bg-white/10 text-[#8D89AF] font-semibold rounded-xl text-sm transition-colors">
                Cancel Edit
              </button>
            )}
            <button type="submit" disabled={loading}
              className={`${editingId ? 'w-2/3' : 'w-full'} py-3.5 btn-primary text-sm flex items-center justify-center gap-2 font-bold`}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4" /> {editingId ? 'Update Will' : 'Save Will'}</>
              )}
            </button>
          </div>
        </form>

        {/* Saved Wills List */}
        <div className="glass-card border border-white/10 bg-[#2B103D]/90 overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-base font-bold text-[#D2C8BC]">Your Wills</h3>
            <p className="text-xs text-[#8D89AF]">All created Digital Wills from your account.</p>
          </div>

          {fetching ? (
            <div className="p-8 text-center text-[#8D89AF] text-sm">Loading wills...</div>
          ) : wills.length === 0 ? (
            <div className="p-12 text-center text-[#8D89AF] text-sm font-medium">No wills created yet.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {wills.map((w) => (
                <div key={w._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/5 transition-colors">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#D2C8BC]">{w.willTitle}</h4>
                    <p className="text-xs text-[#8D89AF]">{w.fullName} · DOB: {w.dob} · Executor: {w.executorName}</p>
                    <p className="text-[10px] text-[#8D89AF]/70 font-mono">Created: {new Date(w.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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

      </main>
    </div>
  );
}
