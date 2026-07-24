import React from 'react';
import { Terminal, Laptop, Globe } from 'lucide-react';

export function AuditLogTable({ logs = [] }) {
  return (
    <div className="glass-card overflow-hidden border border-white/10 bg-[#2B103D]/90">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#731BB8]/30 rounded-xl border border-[#9A2CF2]/40 text-[#9A2CF2]">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#D2C8BC]">Cryptographic Audit Trail</h3>
            <p className="text-xs text-[#8D89AF]">Audit records loaded from real database events.</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-[#4C0F7A]/40 border border-[#9A2CF2]/30 text-[#9A2CF2] rounded-full text-xs font-mono">
          {logs.length} Log Entries
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#221B2A]/80 border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
              <th className="p-4 font-semibold">Timestamp</th>
              <th className="p-4 font-semibold">Action Event</th>
              <th className="p-4 font-semibold">Target User</th>
              <th className="p-4 font-semibold">IP Address</th>
              <th className="p-4 font-semibold">Device & Browser</th>
              <th className="p-4 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-12 text-center text-[#8D89AF] text-xs font-medium">
                  No audit records available.
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-[#8D89AF] font-mono whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-[#731BB8]/30 border border-[#9A2CF2]/40 text-white font-semibold rounded-lg text-[11px] inline-block">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-[#D2C8BC] font-medium whitespace-nowrap">{log.user}</td>
                  <td className="p-4 text-emerald-400 font-mono whitespace-nowrap flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-500" /> {log.ip || '127.0.0.1'}
                  </td>
                  <td className="p-4 text-[#8D89AF] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5 text-[#9A2CF2]" />
                      <span className="truncate max-w-[160px]">{log.device || 'Desktop'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-[#8D89AF] max-w-xs truncate">{log.details || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
