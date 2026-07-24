import React, { useState, useEffect } from 'react';
import { LeftSidebar } from './components/LeftSidebar';
import { DashboardPage } from './pages/DashboardPage';
import { AcceptInvitationPage } from './pages/AcceptInvitationPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { EmailVerifyPage } from './pages/EmailVerifyPage';
import { CreateWillPage } from './pages/CreateWillPage';
import { AssetsPage } from './pages/AssetsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ViewWillPage } from './pages/ViewWillPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [rawToken, setRawToken] = useState(null);
  const [verifyToken, setVerifyToken] = useState(null);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const path = window.location.pathname;

    // Handle /accept-invitation/:token route
    if (path.startsWith('/accept-invitation/')) {
      const token = path.replace('/accept-invitation/', '').trim();
      if (token) {
        setRawToken(token);
        setCurrentPage('accept');
        return;
      }
    }

    // Handle /verify-email/:token route
    if (path.startsWith('/verify-email/')) {
      const token = path.replace('/verify-email/', '').trim();
      if (token) {
        setVerifyToken(token);
        setCurrentPage('verify-email');
        return;
      }
    }

    // Protected route guard: redirect unauthenticated users to login
    if (!currentUser && currentPage !== 'login' && currentPage !== 'register' && currentPage !== 'accept' && currentPage !== 'verify-email') {
      setCurrentPage('login');
    }
  }, [currentUser, currentPage]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', user.token || 'session_token_' + Date.now());
    setCurrentPage('dashboard');
  };

  const handleRegisterSuccess = (user) => {
    // After registration, user must verify email first - do NOT auto-login
    // This function is kept for compatibility but should not be called from RegisterPage
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', user.token || 'session_token_' + Date.now());
    setCurrentPage('dashboard');
  };

  const handleLogout = async () => {
    try {
      if (currentUser?.email) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email })
        });
      }
    } catch (err) {
      // Logout notice
    }

    // Clear JWT Token, Session, Cookies, Local Storage, React State
    localStorage.clear();
    sessionStorage.clear();
    setCurrentUser(null);
    setNotifications([]);
    setCurrentPage('login');
  };

  const handleMarkNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      // Notification read notice
    }
  };

  // Fetch notifications for authenticated users
  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (err) {
        // Notification fetch notice
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Public: Accept Invitation Page
  if (currentPage === 'accept' && rawToken) {
    return <AcceptInvitationPage rawToken={rawToken} onComplete={() => { setCurrentPage('login'); window.history.pushState({}, '', '/'); }} />;
  }

  // Public: Email Verification Page
  if (currentPage === 'verify-email' && verifyToken) {
    return <EmailVerifyPage rawToken={verifyToken} onGoToLogin={() => { setCurrentPage('login'); window.history.pushState({}, '', '/'); }} />;
  }

  // Unauthenticated: Login / Register pages only
  if (!currentUser) {
    if (currentPage === 'register') {
      return (
        <RegisterPage
          onRegisterSuccess={handleRegisterSuccess}
          onGoToLogin={() => setCurrentPage('login')}
        />
      );
    }

    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onGoToLanding={() => setCurrentPage('login')}
        onGoToRegister={() => setCurrentPage('register')}
      />
    );
  }

  // Authenticated: Persistent Left Sidebar + Content Area
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage currentUser={currentUser} />;
      case 'create-will':
        return <CreateWillPage currentUser={currentUser} />;
      case 'beneficiaries':
        return <BeneficiariesPage currentUser={currentUser} />;
      case 'assets':
        return <AssetsPage currentUser={currentUser} />;
      case 'documents':
        return <DocumentsPage currentUser={currentUser} />;
      case 'view-will':
        return <ViewWillPage currentUser={currentUser} />;
      case 'audit-trail':
        return <AuditTrailPage currentUser={currentUser} />;
      case 'settings':
        return <SettingsPage currentUser={currentUser} />;
      default:
        return <DashboardPage currentUser={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#221B2A] text-white flex overflow-hidden">
      {/* PERSISTENT FIXED LEFT SIDEBAR */}
      <LeftSidebar
        activePage={currentPage}
        setActivePage={setCurrentPage}
        currentUser={currentUser}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
      />

      {/* INDEPENDENT SCROLLABLE CONTENT AREA */}
      <div className="lg:pl-64 flex-1 h-screen overflow-y-auto pt-14 lg:pt-0">
        {renderPage()}
      </div>
    </div>
  );
}
