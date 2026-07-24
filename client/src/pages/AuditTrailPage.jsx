import React, { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';

export function AuditTrailPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="min-h-screen bg-[#221B2A] text-white">
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#D2C8BC]">Audit Trail</h1>
              <p className="text-xs text-[#8D89AF]">Complete event log of all account activity.</p>
            </div>
          </div>

          <button onClick={fetchLogs}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-[#8D89AF] flex items-center gap-2 transition-colors border border-white/10">
            <RefreshCw className="w-3.5 h-3.5 text-[#9A2CF2]" /> Refresh
          </button>
        </div>

        <div className="glass-card border border-white/10 bg-[#2B103D]/90 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#221B2A]/80 border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">IP Address</th>
                  <th className="p-4 font-semibold">Browser / OS</th>
                  <th className="p-4 font-semibold">Device</th>
                  <th className="p-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan="8" className="p-8 text-center text-[#8D89AF]">Loading audit logs...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="8" className="p-12 text-center text-[#8D89AF] text-sm font-medium">No audit records available.</td></tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
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
                      <td className="p-4 whitespace-nowrap text-[#8D89AF] font-mono text-[11px]">{log.clientIp || log.ip || '—'}</td>
                      <td className="p-4 whitespace-nowrap text-[#8D89AF] text-[11px]">{log.browser || '—'} / {log.os || '—'}</td>
                      <td className="p-4 whitespace-nowrap text-[#8D89AF] text-[11px]">{log.device || '—'}</td>
                      <td className="p-4 text-[#8D89AF] text-[11px] max-w-[200px] truncate">{log.description || log.details || '—'}</td>
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
