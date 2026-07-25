import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, RefreshCw, Trash2, AlertTriangle, X, CheckCircle, 
  Activity, ShieldCheck, Filter, Search, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AuditTrailPage() {
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'activity'
  const [logs, setLogs] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmModal, setConfirmModal] = useState(null); // null | 'single' | 'selected' | 'all'
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Toast
  const [toast, setToast] = useState({ message: '', type: '' });

  const token = localStorage.getItem('token');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 4000);
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
    }

    try {
      const actRes = await fetch('/api/audit-logs/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const actData = await actRes.json();
      setActivities(actData.activities || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === logs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(logs.map(l => l._id)));
    }
  };

  // ── Delete Single ──
  const handleDeleteSingle = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/audit-logs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setLogs(prev => prev.filter(l => l._id !== id));
        setActivities(prev => prev.filter(a => a._id !== id));
        showToast('Audit record deleted successfully.');
      } else {
        showToast(data.message || 'Failed to delete audit record.', 'error');
      }
    } catch (err) {
      showToast('Error deleting audit record.', 'error');
    }
    setDeleting(false);
    setConfirmModal(null);
    setDeleteTargetId(null);
  };

  // ── Delete Selected ──
  const handleDeleteSelected = async () => {
    setDeleting(true);
    try {
      for (const id of selectedIds) {
        await fetch(`/api/audit-logs/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
      setLogs(prev => prev.filter(l => !selectedIds.has(l._id)));
      setActivities(prev => prev.filter(a => !selectedIds.has(a._id)));
      setSelectedIds(new Set());
      showToast(`${selectedIds.size} audit record(s) deleted successfully.`);
    } catch (err) {
      showToast('Error deleting selected records.', 'error');
    }
    setDeleting(false);
    setConfirmModal(null);
  };

  // ── Delete All ──
  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/audit-logs', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLogs([]);
        setActivities([]);
        setSelectedIds(new Set());
        showToast('All audit history deleted successfully.');
      } else {
        showToast(data.message || 'Failed to clear audit history.', 'error');
      }
    } catch (err) {
      showToast('Error clearing audit history.', 'error');
    }
    setDeleting(false);
    setConfirmModal(null);
  };

  const handleConfirmAction = () => {
    if (confirmModal === 'single' && deleteTargetId) handleDeleteSingle(deleteTargetId);
    else if (confirmModal === 'selected') handleDeleteSelected();
    else if (confirmModal === 'all') handleDeleteAll();
  };

  const filteredLogs = logs.filter(l => 
    (l.action && l.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (l.userEmail && l.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (l.description && l.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredActivities = activities.filter(a => 
    (a.action && a.action.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.user && a.user.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (a.module && a.module.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#221B2A] text-white">
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* Page Header */}
        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#D2C8BC]">Cryptographic Audit Trail & Activity Logs</h1>
              <p className="text-xs text-[#8D89AF]">Immutable security event log with cryptographic hashing & activity monitoring.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {selectedIds.size > 0 && (
              <button
                onClick={() => setConfirmModal('selected')}
                className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.size})
              </button>
            )}
            <button
              onClick={() => setConfirmModal('all')}
              disabled={logs.length === 0}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-30"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete All History
            </button>
            <button onClick={fetchLogs}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-[#8D89AF] flex items-center gap-2 transition-colors border border-white/10">
              <RefreshCw className="w-3.5 h-3.5 text-[#9A2CF2]" /> Refresh
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

        {/* CONTROLS: TABS & SEARCH */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="flex bg-[#221B2A] p-1.5 rounded-xl border border-white/10 w-fit">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'audit'
                  ? 'bg-[#731BB8] text-white shadow-md'
                  : 'text-[#8D89AF] hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Cryptographic Audit Trail ({logs.length})
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'activity'
                  ? 'bg-[#731BB8] text-white shadow-md'
                  : 'text-[#8D89AF] hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" /> View Activity Logs ({activities.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#8D89AF]" />
            <input
              type="text"
              placeholder="Search logs by action or user..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#2B103D]/90 border border-white/10 rounded-xl text-white text-xs placeholder-[#8D89AF] focus:outline-none focus:border-[#9A2CF2] w-full sm:w-64"
            />
          </div>
        </div>

        {/* TAB 1: CRYPTOGRAPHIC AUDIT TRAIL TABLE (Module 3 & 8) */}
        {activeTab === 'audit' && (
          <div className="glass-card border border-white/10 bg-[#2B103D]/90 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#221B2A]/80 border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
                    <th className="p-4 font-semibold w-10">
                      <input type="checkbox" checked={logs.length > 0 && selectedIds.size === logs.length}
                        onChange={toggleSelectAll}
                        className="accent-[#9A2CF2] w-3.5 h-3.5 cursor-pointer" />
                    </th>
                    <th className="p-4 font-semibold">Timestamp</th>
                    <th className="p-4 font-semibold">Action</th>
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">IP Address</th>
                    <th className="p-4 font-semibold">Description</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="8" className="p-8 text-center text-[#8D89AF]">Loading audit logs...</td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan="8" className="p-12 text-center text-[#8D89AF] text-sm font-medium">No audit records match your search.</td></tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log._id} className={`hover:bg-white/5 transition-colors ${selectedIds.has(log._id) ? 'bg-[#9A2CF2]/5' : ''}`}>
                        <td className="p-4">
                          <input type="checkbox" checked={selectedIds.has(log._id)}
                            onChange={() => toggleSelect(log._id)}
                            className="accent-[#9A2CF2] w-3.5 h-3.5 cursor-pointer" />
                        </td>
                        <td className="p-4 whitespace-nowrap text-[#8D89AF] font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-[#731BB8]/20 border border-[#9A2CF2]/30 rounded-lg text-[#D2C8BC] font-medium text-xs">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-white font-medium">{log.user || log.userEmail || '—'}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            log.status === 'FAILED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {log.status || 'INFO'}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-[#8D89AF] font-mono text-[11px]">{log.clientIp || log.ip || '127.0.0.1'}</td>
                        <td className="p-4 text-[#8D89AF] text-[11px] max-w-[250px] truncate">{log.description || log.details || '—'}</td>
                        <td className="p-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => { setDeleteTargetId(log._id); setConfirmModal('single'); }}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg transition-colors"
                            title="Delete this audit record"
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
        )}

        {/* TAB 2: VIEW ACTIVITY MODULE TABLE (Module 7) */}
        {activeTab === 'activity' && (
          <div className="glass-card border border-white/10 bg-[#2B103D]/90 overflow-hidden">
            <div className="p-5 border-b border-white/10">
              <h3 className="text-base font-bold text-[#D2C8BC]">System Activity Log</h3>
              <p className="text-xs text-[#8D89AF]">Detailed date, time, user, action, module, IP, and device status tracking.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#221B2A]/80 border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Time</th>
                    <th className="p-4 font-semibold">User</th>
                    <th className="p-4 font-semibold">Action</th>
                    <th className="p-4 font-semibold">Module</th>
                    <th className="p-4 font-semibold">IP Address</th>
                    <th className="p-4 font-semibold">Device</th>
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="8" className="p-8 text-center text-[#8D89AF]">Loading activities...</td></tr>
                  ) : filteredActivities.length === 0 ? (
                    <tr><td colSpan="8" className="p-12 text-center text-[#8D89AF] text-sm font-medium">No activity records found.</td></tr>
                  ) : (
                    filteredActivities.map((act) => (
                      <tr key={act._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 whitespace-nowrap text-[#8D89AF] font-mono">{act.date}</td>
                        <td className="p-4 whitespace-nowrap text-white font-mono">{act.time}</td>
                        <td className="p-4 whitespace-nowrap font-medium text-white">{act.user}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-[#731BB8]/20 border border-[#9A2CF2]/30 rounded-lg text-[#D2C8BC] font-semibold text-xs">
                            {act.action}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-[#9A2CF2] font-semibold">{act.module}</td>
                        <td className="p-4 whitespace-nowrap text-[#8D89AF] font-mono text-[11px]">{act.ipAddress}</td>
                        <td className="p-4 whitespace-nowrap text-[#8D89AF]">{act.device}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            act.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {act.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ── CONFIRMATION MODAL FOR DELETE ── */}
      <AnimatePresence>
        {confirmModal && (
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
                <h3 className="text-xl font-bold text-[#D2C8BC]">Are you sure?</h3>
                <p className="text-xs text-[#8D89AF] leading-relaxed">
                  {confirmModal === 'single' && 'This will permanently delete this audit record.'}
                  {confirmModal === 'selected' && `This will permanently delete ${selectedIds.size} selected audit record${selectedIds.size !== 1 ? 's' : ''}.`}
                  {confirmModal === 'all' && 'This will permanently delete ALL audit history.'}
                </p>
                <p className="text-xs text-rose-300 font-semibold">This action cannot be undone.</p>
              </div>

              <div className="flex items-center gap-3 justify-center pt-2">
                <button
                  onClick={() => { setConfirmModal(null); setDeleteTargetId(null); }}
                  disabled={deleting}
                  className="w-1/2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[#8D89AF] text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={deleting}
                  className="w-1/2 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-3.5 h-3.5" /> Delete</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
