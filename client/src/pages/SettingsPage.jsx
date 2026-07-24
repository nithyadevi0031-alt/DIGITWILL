import React from 'react';
import { Settings, Shield, User, Mail, Phone } from 'lucide-react';

export function SettingsPage({ currentUser }) {
  return (
    <div className="min-h-screen bg-[#221B2A] text-white">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#D2C8BC]">Account Settings</h1>
              <p className="text-xs text-[#8D89AF]">View your account profile and security settings.</p>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-5">
          <h3 className="text-base font-bold text-[#D2C8BC] flex items-center gap-2">
            <User className="w-5 h-5 text-[#9A2CF2]" /> Profile Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Full Name</p>
              <p className="text-sm text-white font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-[#9A2CF2]" />
                {currentUser?.name || currentUser?.fullName || '—'}
              </p>
            </div>
            <div className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Email Address</p>
              <p className="text-sm text-white font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#9A2CF2]" />
                {currentUser?.email || '—'}
              </p>
            </div>
            <div className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Account Role</p>
              <p className="text-sm text-white font-medium capitalize">{currentUser?.role || 'owner'}</p>
            </div>
            <div className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Email Verification</p>
              <p className="text-sm text-emerald-300 font-medium flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" /> Verified
              </p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-4">
          <h3 className="text-base font-bold text-[#D2C8BC] flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#9A2CF2]" /> Security Settings
          </h3>
          <div className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5">
            <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Authentication Type</p>
            <p className="text-sm text-white font-medium">JWT Token + bcrypt Password Hashing</p>
          </div>
          <div className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5">
            <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Session Status</p>
            <p className="text-sm text-emerald-300 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Active Secure Session
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
