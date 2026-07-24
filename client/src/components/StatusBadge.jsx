import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Send } from 'lucide-react';

export function StatusBadge({ status }) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Verified':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Verified'
        };
      case 'Accepted':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Accepted'
        };
      case 'Pending':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />,
          label: 'Pending'
        };
      case 'Expired':
        return {
          bg: 'bg-[#D95F30]/20 text-[#D95F30] border-[#D95F30]/50',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#D95F30]" />,
          label: 'Expired'
        };
      case 'Declined':
      case 'Rejected':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Declined'
        };
      case 'Invitation Sent':
      default:
        return {
          bg: 'bg-slate-700/40 text-slate-300 border-slate-600/50',
          icon: <Send className="w-3.5 h-3.5 text-slate-400" />,
          label: status || 'Invitation Sent'
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-md ${badge.bg}`}>
      {badge.icon}
      {badge.label}
    </span>
  );
}
