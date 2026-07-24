import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from './services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate(values) {
    const nextErrors = {};
    if (!values.fullName.trim()) nextErrors.fullName = 'Full name is required';
    if (!values.email.trim()) nextErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = 'Enter a valid email';
    if (!values.password) nextErrors.password = 'Password is required';
    else if (values.password.length < 8) nextErrors.password = 'Password must be at least 8 characters';
    return nextErrors;
  }

  async function submit(event) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const payload = await api.post('/api/auth/register', form);
      localStorage.setItem('digital_will_token', payload.token);
      navigate('/dashboard');
    } catch (error) {
      setMessage(error.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFF6EC] px-6 py-16 text-[#111111]">
      <div className="w-full max-w-md rounded-[28px] border border-[#f2dfc8] bg-white p-8 shadow-[0_24px_80px_-28px_rgba(17,17,17,0.25)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF6B00]">Create account</p>
        <h1 className="mt-3 text-2xl font-semibold">Protect your digital legacy</h1>
        <p className="mt-2 text-sm text-slate-500">Create a secure account and start your inheritance plan.</p>

        <form className="mt-6 space-y-3" onSubmit={submit}>
          <div>
            <input className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Full name" />
            {errors.fullName ? <p className="mt-1 text-sm text-red-600">{errors.fullName}</p> : null}
          </div>
          <div>
            <input className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email" />
            {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email}</p> : null}
          </div>
          <div>
            <input type="password" className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Password" />
            {errors.password ? <p className="mt-1 text-sm text-red-600">{errors.password}</p> : null}
          </div>
          <button disabled={submitting} className="w-full rounded-2xl bg-[#FF6B00] px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-70">
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-red-600">{message}</p> : null}
        <p className="mt-4 text-sm text-slate-500">
          Already have an account? <Link to="/login" className="font-semibold text-[#FF6B00]">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
