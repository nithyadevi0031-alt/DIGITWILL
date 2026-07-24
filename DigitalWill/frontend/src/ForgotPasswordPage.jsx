import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from './services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      const payload = await api.post('/api/auth/forgot-password', { email });
      setMessage(payload.ok ? 'Password reset code generated. Use it in the reset flow.' : 'Unable to send reset instructions.');
      setError('');
    } catch (err) {
      setError(err.message || 'Request failed');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF6EC] px-6 py-16 text-[#111111]">
      <div className="w-full max-w-md rounded-[28px] border border-[#f2dfc8] bg-white p-8 shadow-[0_24px_80px_-28px_rgba(17,17,17,0.25)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF6B00]">Reset password</p>
        <h1 className="mt-3 text-2xl font-semibold">Recover your account</h1>
        <p className="mt-2 text-sm text-slate-500">Enter your email to request a password reset code.</p>

        <form className="mt-6 space-y-3" onSubmit={submit}>
          <input className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <button className="w-full rounded-2xl bg-[#FF6B00] px-4 py-3 font-semibold text-white transition hover:opacity-90">Send reset code</button>
        </form>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
        <p className="mt-4 text-sm text-slate-500">
          <Link to="/login" className="font-semibold text-[#FF6B00]">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
