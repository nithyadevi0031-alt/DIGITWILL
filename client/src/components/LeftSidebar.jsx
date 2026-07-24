import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Cpu, Lock, UserPlus, Home, KeyRound, Terminal, Bell, 
  ChevronRight, LogOut, Sparkles, User, Menu, X,
  FileText, Landmark, FileUp, Eye, ClipboardList, Settings
} from 'lucide-react';

export function LeftSidebar({ activePage, setActivePage, currentUser, onLogout, notifications = [], onMarkNotificationsRead }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Cpu className="w-4 h-4" /> },
    { id: 'create-will', label: 'Create Will', icon: <FileText className="w-4 h-4" /> },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'assets', label: 'Assets', icon: <Landmark className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileUp className="w-4 h-4" /> },
    { id: 'view-will', label: 'View Will', icon: <Eye className="w-4 h-4" /> },
    { id: 'audit-trail', label: 'Audit Trail', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleNavClick = (id) => {
    setActivePage(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-nav px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-[#D2C8BC] text-sm tracking-wider">
            DIGITAL WILL <span className="text-[#9A2CF2]">AI</span>
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-[#4C0F7A]/40 border border-white/10 rounded-xl text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* LEFT VERTICAL NAVBAR */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-[#2B103D]/95 backdrop-blur-2xl border-r border-white/10 p-5 flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          
          {/* BRAND LOGO */}
          <div 
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer p-2 rounded-2xl hover:bg-white/5 transition-colors group"
          >
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl shadow-lg shadow-[#9A2CF2]/30 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-base font-black tracking-wider text-[#D2C8BC] block group-hover:text-white transition-colors">
                DIGITAL WILL <span className="text-[#9A2CF2]">AI</span>
              </span>
              <span className="text-[10px] text-[#8D89AF] font-mono tracking-widest uppercase block">
                VAULT MANAGER
              </span>
            </div>
          </div>

          {/* SECURITY STATUS BADGE */}
          <div className="p-3 bg-[#221B2A]/90 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Secure Session
            </span>
            <span className="text-[10px] font-mono text-[#9A2CF2] bg-[#731BB8]/30 px-2 py-0.5 rounded">JWT</span>
          </div>

          {/* VERTICAL NAVIGATION MENU */}
          <nav className="space-y-1.5 pt-2">
            <div className="px-3 pb-2 text-[10px] font-bold text-[#8D89AF] uppercase tracking-wider">
              Navigation
            </div>

            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all group ${
                  activePage === item.id
                    ? 'bg-gradient-to-r from-[#731BB8] to-[#9A2CF2] text-white shadow-lg shadow-[#9A2CF2]/25 font-bold'
                    : 'text-[#8D89AF] hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`p-1.5 rounded-lg ${activePage === item.id ? 'bg-white/20 text-white' : 'bg-[#4C0F7A]/30 text-[#9A2CF2]'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activePage === item.id ? 'translate-x-1 text-white' : 'text-[#8D89AF] opacity-0 group-hover:opacity-100'}`} />
              </button>
            ))}
          </nav>

        </div>

        {/* BOTTOM PROFILE & NOTIFICATIONS */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          
          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications && onMarkNotificationsRead) onMarkNotificationsRead();
              }}
              className="w-full p-2.5 bg-[#221B2A] border border-white/10 rounded-xl text-xs text-[#8D89AF] hover:text-white flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#9A2CF2]" /> Notifications
              </span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 bg-[#D95F30] text-white font-bold rounded-full text-[10px]">
                  {unreadCount}
                </span>
              ) : (
                <span className="text-[10px] text-[#8D89AF]">Live</span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-12 left-0 w-72 glass-card bg-[#2B103D]/95 border border-[#9A2CF2]/40 p-4 shadow-2xl z-50 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-[#D2C8BC]">System Notifications</span>
                    <span className="text-[10px] text-[#8D89AF]">{notifications.length} Items</span>
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#8D89AF] py-4 text-center font-medium">No notifications.</p>
                    ) : (
                      notifications.map((n, idx) => (
                        <div key={idx} className="p-2.5 bg-[#221B2A] rounded-lg text-[11px] space-y-1">
                          <p className="font-semibold text-[#D2C8BC]">{n.title}</p>
                          <p className="text-[#8D89AF] text-[10px]">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Profile Card */}
          <div className="p-3 bg-[#221B2A] border border-white/10 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#731BB8] to-[#9A2CF2] flex items-center justify-center text-white text-xs font-bold border border-white/20">
                {currentUser?.name ? currentUser.name.substring(0, 2).toUpperCase() : <User className="w-4 h-4 text-white" />}
              </div>
              <div className="text-left">
                <span className="block text-xs font-bold text-[#D2C8BC] truncate max-w-[100px]">
                  {currentUser?.name || currentUser?.fullName || 'User'}
                </span>
                <span className="block text-[10px] text-[#9A2CF2] font-mono capitalize">
                  {currentUser?.role || 'owner'}
                </span>
              </div>
            </div>

            {currentUser && onLogout && (
              <button
                onClick={onLogout}
                title="Log Out"
                className="p-1.5 hover:bg-white/10 text-[#8D89AF] hover:text-rose-400 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </aside>
    </>
  );
}
