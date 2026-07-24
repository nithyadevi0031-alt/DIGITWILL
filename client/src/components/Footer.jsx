import React from 'react';
import { Shield, Lock, ExternalLink, Mail, Heart, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#2B103D] border-t border-white/10 pt-16 pb-12 text-[#8D89AF]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Col 1: Brand & Tagline */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-lg font-black text-[#D2C8BC] tracking-wider">
                DIGITAL WILL <span className="text-[#9A2CF2]">AI</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#8D89AF]">
              Enterprise-grade digital asset inheritance vault. Cryptographically secured with Passkeys, verified MX domain checks, and zero-password authentication.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#9A2CF2] font-semibold">
              <Lock className="w-3.5 h-3.5" /> WebAuthn Passkey Standard Enabled
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-[#D2C8BC] uppercase tracking-wider mb-4">Architecture</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#hero" className="hover:text-white transition-colors">Cyber Vault Overview</a></li>
              <li><a href="#features" className="hover:text-[#9A2CF2] transition-colors">Nominee Verification Engine</a></li>
              <li><a href="#passkey" className="hover:text-[#9A2CF2] transition-colors">WebAuthn FIDO2 Standard</a></li>
              <li><a href="#emergency" className="hover:text-[#9A2CF2] transition-colors">Emergency Protocol Rules</a></li>
            </ul>
          </div>

          {/* Col 3: Compliance & Security */}
          <div>
            <h4 className="text-xs font-bold text-[#D2C8BC] uppercase tracking-wider mb-4">Security & Legal</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#security" className="hover:text-white transition-colors">SHA-256 Hashed Tokens</a></li>
              <li><a href="#audit" className="hover:text-white transition-colors">Immutable Audit Logs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Estate Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Notice & GDPR</a></li>
            </ul>
          </div>

          {/* Col 4: Contact & System Notice */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#D2C8BC] uppercase tracking-wider mb-1">Support & Verification</h4>
            <p className="text-xs text-[#8D89AF]">
              All beneficiary invitations are signed with 24-hour expiration tokens and sent via Nodemailer/SMTP.
            </p>
            <div className="p-3 bg-[#221B2A] border border-white/5 rounded-xl text-xs flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#9A2CF2]" /> support@digiwill.ai
              </span>
              <ExternalLink className="w-3 h-3 text-[#8D89AF]" />
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-[#8D89AF] gap-4">
          <p>© 2026 Digital Will AI, Inc. All rights reserved. Strictly styled in luxury cyber violet palette.</p>
          <div className="flex items-center gap-6">
            <span>Security Status: <strong className="text-emerald-400 font-normal">Active & Operational</strong></span>
            <span>Version: <strong className="text-[#9A2CF2]">2.4.0 (Enterprise)</strong></span>
          </div>
        </div>

      </div>
    </footer>
  );
}
