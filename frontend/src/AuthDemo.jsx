import { useState } from 'react';

const API_BASE = 'http://localhost:5000';

export default function AuthDemo() {
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [form, setForm] = useState({ fullName: 'Demo Owner', email: 'owner@digitalwill.ai', password: 'Secure123!' });
  const [otpInput, setOtpInput] = useState('');

  async function register() {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    setMessage(payload.message || `Registered ${payload.user?.email || 'successfully'}`);
    setToken(payload.token || '');
  }

  async function login() {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, password: form.password }),
    });
    const payload = await response.json();
    setMessage(payload.message || `Signed in as ${payload.user?.email || 'user'}`);
    setToken(payload.token || '');
  }

  async function requestOtp() {
    const response = await fetch(`${API_BASE}/api/auth/request-otp`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    setMessage(payload.message || `OTP requested: ${payload.code}`);
  }

  async function verifyOtp() {
    const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ code: otpInput }),
    });
    const payload = await response.json();
    setMessage(payload.ok ? 'OTP verified successfully' : 'OTP verification failed');
  }

  async function profile() {
    const response = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    setMessage(payload.message || `Profile loaded for ${payload.user?.email || 'user'}`);
  }

  async function changePassword() {
    const response = await fetch(`${API_BASE}/api/secure/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: form.password }),
    });
    const payload = await response.json();
    setMessage(payload.ok ? 'Password changed' : 'Password change failed');
  }

  async function logoutAll() {
    const response = await fetch(`${API_BASE}/api/auth/logout-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json();
    setMessage(payload.ok ? 'All sessions revoked' : 'Could not revoke sessions');
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <h2 className="text-lg font-medium">Phase A — Auth & Account Security</h2>
      <div className="mt-4 space-y-3">
        <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Full name" />
        <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" />
        <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" />
        <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" value={otpInput} onChange={(event) => setOtpInput(event.target.value)} placeholder="OTP code" />
        <div className="flex flex-wrap gap-3">
          <button className="rounded bg-cyan-600 px-4 py-2 text-sm font-medium text-white" onClick={register}>Register</button>
          <button className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white" onClick={login}>Login</button>
          <button className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white" onClick={requestOtp}>Request OTP</button>
          <button className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white" onClick={verifyOtp}>Verify OTP</button>
          <button className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white" onClick={profile}>Load profile</button>
          <button className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white" onClick={changePassword}>Change password</button>
          <button className="rounded bg-slate-700 px-4 py-2 text-sm font-medium text-white" onClick={logoutAll}>Logout all</button>
        </div>
      </div>
      {message ? <p className="mt-4 text-sm text-slate-300">{message}</p> : null}
      {token ? <p className="mt-3 break-all text-xs text-cyan-300">JWT: {token}</p> : null}
    </div>
  );
}
