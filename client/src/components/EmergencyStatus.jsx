import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Lock, ShieldCheck, Cpu } from 'lucide-react';

export function EmergencyStatus({ beneficiaryId, beneficiaryName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!beneficiaryId) return;

    fetch(`/api/emergency/status/${beneficiaryId}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [beneficiaryId]);

  if (loading) {
    return (
      <div className="p-6 glass-card text-center text-xs text-[#8D89AF] animate-pulse">
        Evaluating Emergency Vault Access Protocol...
      </div>
    );
  }

  if (!data) return null;

  const ruleLabels = [
    { key: 'acceptedInvitation', label: 'Beneficiary Accepted Invitation', req: 'Required' },
    { key: 'accountVerified', label: 'Beneficiary Account Verified', req: 'Required' },
    { key: 'passkeyRegistered', label: 'Passkey (WebAuthn) Hardware Registered', req: 'Required' },
    { key: 'ownerAssignedAssets', label: 'Owner Assigned Vault Digital Assets', req: 'Required' },
    { key: 'emergencyRequestApproved', label: 'Emergency Request Initiated & Approved', req: 'Required' },
    { key: 'otpVerificationCompleted', label: 'OTP Verification Protocol Completed', req: 'Required' },
    { key: 'faceVerificationCompleted', label: 'Face Verification Check Passed', req: 'Required' },
    { key: 'adminApprovalGranted', label: 'Admin Estate Approval Granted', req: 'Required' }
  ];

  return (
    <div className="glass-card p-6 border border-white/10 space-y-5 bg-[#2B103D]/95">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border ${data.isAccessGranted ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border-rose-500/40'}`}>
            {data.isAccessGranted ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#D2C8BC]">Emergency Access Rules Engine</h3>
            <p className="text-xs text-[#8D89AF]">Evaluating protocol clearance for beneficiary <strong className="text-white">{data.beneficiaryName}</strong></p>
          </div>
        </div>

        <div className={`px-4 py-2 rounded-xl text-xs font-bold border tracking-wider uppercase ${data.isAccessGranted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-rose-500/20 text-rose-300 border-rose-500/50'}`}>
          ACCESS {data.status}
        </div>
      </div>

      {/* Rules Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ruleLabels.map(({ key, label }) => {
          const isPassed = Boolean(data.rules && data.rules[key]);
          return (
            <div
              key={key}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                isPassed ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isPassed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="font-medium text-white/90">{label}</span>
              </div>
              <span className="text-[10px] font-mono opacity-60 uppercase">{isPassed ? 'PASSED' : 'DENIED'}</span>
            </div>
          );
        })}
      </div>

      <div className="p-3 bg-[#221B2A] border border-white/5 rounded-xl text-[11px] text-[#8D89AF] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#9A2CF2]" /> Mandatory Rule Engine Policy: All 8 checks must pass to grant access.
        </span>
        <span className="font-mono text-[#9A2CF2]">POLICY #EMERG-8</span>
      </div>
    </div>
  );
}
