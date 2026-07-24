import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Bell, Search, User, ChevronDown, CheckCircle2, Lock, Cpu } from 'lucide-react';

export function Navbar({ activePage, setActivePage, notifications = [], onMarkNotificationsRead }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full glass-nav px-6 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* LOGO */}
        <div 
          onClick={() => setActivePage('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl shadow-lg shadow-[#9A2CF2]/30 group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-wide text-[#D2C8BC] group-hover:text-white transition-colors">
                DIGITAL WILL <span className="text-[#9A2CF2]">AI</span>
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#4C0F7A]/80 text-[#9A2CF2] border border-[#9A2CF2]/30 rounded-md tracking-widest uppercase">
                VAULT
              </span>
            </div>
            <p className="text-[10px] text-[#8D89AF] tracking-wider uppercase">Cryptographic Beneficiary Protocol</p>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-1 bg-[#221B2A]/60 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
          <button
            onClick={() => setActivePage('landing')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              activePage === 'landing' 
                ? 'bg-gradient-to-r from-[#731BB8] to-[#9A2CF2] text-white shadow-md' 
                : 'text-[#8D89AF] hover:text-white hover:bg-white/5'
            }`}
          >
            Landing Page
          </button>
          
          <button
            onClick={() => setActivePage('dashboard')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activePage === 'dashboard' 
                ? 'bg-gradient-to-r from-[#731BB8] to-[#9A2CF2] text-white shadow-md' 
                : 'text-[#8D89AF] hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-4 h-4 text-[#9A2CF2]" />
            Owner Dashboard
          </button>

          <button
            onClick={() => setActivePage('login')}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${
              activePage === 'login' 
                ? 'bg-gradient-to-r from-[#731BB8] to-[#9A2CF2] text-white shadow-md' 
                : 'text-[#8D89AF] hover:text-white hover:bg-white/5'
            }`}
          >
            <Lock className="w-4 h-4 text-[#9A2CF2]" />
            Sign In / Login
          </button>

          <a
            href="#vault"
            onClick={() => { if(activePage !== 'landing') setActivePage('landing'); }}
            className="px-4 py-2 text-sm font-semibold text-[#8D89AF] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            Digital Vault
          </a>
          
          <a
            href="#passkey"
            onClick={() => { if(activePage !== 'landing') setActivePage('landing'); }}
            className="px-4 py-2 text-sm font-semibold text-[#8D89AF] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            Passkey WebAuthn
          </a>
        </nav>

        {/* RIGHT CONTROLS */}
        <div className="flex items-center gap-4">
          
          {/* Search Input Placeholder */}
          <div className="hidden lg:flex items-center gap-2 bg-[#221B2A]/80 border border-white/10 px-3.5 py-2 rounded-xl text-sm text-[#8D89AF] focus-within:border-[#9A2CF2] transition-all w-48">
            <Search className="w-4 h-4 text-[#8D89AF]" />
            <input 
              type="text" 
              placeholder="Search vault..." 
              className="bg-transparent border-none text-xs text-white focus:outline-none w-full placeholder-[#8D89AF]/50"
            />
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && onMarkNotificationsRead) onMarkNotificationsRead();
              }}
              className="relative p-2.5 bg-[#4C0F7A]/30 border border-white/10 rounded-xl text-[#8D89AF] hover:text-white hover:border-[#9A2CF2]/50 transition-all"
            >
              <Bell className="w-5 h-5 text-[#8D89AF]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D95F30] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 glass-card bg-[#2B103D]/95 border border-[#9A2CF2]/30 p-4 shadow-2xl z-50"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <h3 className="text-sm font-bold text-[#D2C8BC] flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#9A2CF2]" /> Audit Notifications
                    </h3>
                    <span className="text-[11px] text-[#8D89AF]">{notifications.length} Total</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#8D89AF] text-center py-4">No recent notifications</p>
                    ) : (
                      notifications.map((n, idx) => (
                        <div 
                          key={idx} 
                          className="p-3 bg-[#221B2A]/80 border border-white/5 rounded-xl text-xs space-y-1 hover:border-[#9A2CF2]/40 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#D2C8BC]">{n.title}</span>
                            <span className="text-[10px] text-[#8D89AF]">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[#8D89AF] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2.5 p-1.5 pl-3 bg-[#4C0F7A]/20 border border-white/10 rounded-2xl hover:border-[#9A2CF2]/40 transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#731BB8] to-[#9A2CF2] flex items-center justify-center font-bold text-white text-xs border border-white/20">
                AV
              </div>
              <div className="hidden sm:block text-left pr-1">
                <span className="block text-xs font-semibold text-[#D2C8BC]">Alexander Vance</span>
                <span className="block text-[10px] text-[#9A2CF2] font-mono">Vault Owner</span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#8D89AF]" />
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-3 w-56 glass-card bg-[#2B103D]/95 border border-[#9A2CF2]/30 p-3 shadow-2xl z-50 space-y-1"
                >
                  <div className="p-2 border-b border-white/10 mb-1">
                    <p className="text-xs font-bold text-[#D2C8BC]">Alexander Vance</p>
                    <p className="text-[11px] text-[#8D89AF]">alexander@digiwill.ai</p>
                  </div>

                  <button 
                    onClick={() => { setActivePage('dashboard'); setShowProfile(false); }}
                    className="w-full text-left p-2 hover:bg-white/5 rounded-lg text-xs font-medium text-white flex items-center gap-2"
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#9A2CF2]" /> Security Dashboard
                  </button>

                  <div className="p-2 bg-[#731BB8]/20 border border-[#9A2CF2]/30 rounded-lg text-[10px] text-[#8D89AF] flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-[#9A2CF2]" />
                    <span>Passkey Protected</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </header>
  );
}
