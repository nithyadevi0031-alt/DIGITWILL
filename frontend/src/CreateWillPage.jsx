import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';

const categories = ['bank', 'cloud storage', 'email', 'social media', 'crypto', 'insurance', 'property', 'government docs', 'subscriptions', 'other'];

export default function CreateWillPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [assetForm, setAssetForm] = useState({ name: '', assetType: '', category: 'bank', securityLevel: 'high', emergencyPolicy: 'review-required', value: '' });
  const [nomineeForm, setNomineeForm] = useState({ fullName: '', email: '', relationship: '', policy: 'review-required' });
  const [assets, setAssets] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('digital_will_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const canAdvance = useMemo(() => {
    if (step === 1) return assets.length > 0;
    if (step === 2) return nominees.length > 0;
    return true;
  }, [assets.length, nominees.length, step]);

  async function addAsset() {
    const token = localStorage.getItem('digital_will_token');
    const response = await fetch(`${API_BASE}/api/vault/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(assetForm),
    });
    const payload = await response.json();
    if (payload.asset) {
      setAssets((current) => [payload.asset, ...current]);
      setAssetForm({ name: '', assetType: '', category: 'bank', securityLevel: 'high', emergencyPolicy: 'review-required', value: '' });
    }
  }

  async function addNominee() {
    const token = localStorage.getItem('digital_will_token');
    const response = await fetch(`${API_BASE}/api/vault/nominees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ relationship: nomineeForm.relationship, contactInfo: nomineeForm.email, policy: nomineeForm.policy, nomineeId: nomineeForm.email, ownerId: 'self' }),
    });
    const payload = await response.json();
    if (payload.nominee) {
      setNominees((current) => [payload.nominee, ...current]);
      setNomineeForm({ fullName: '', email: '', relationship: '', policy: 'review-required' });
    }
  }

  async function submitWill() {
    const token = localStorage.getItem('digital_will_token');
    const response = await fetch(`${API_BASE}/api/vault/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'pending', verificationStatus: 'in-progress', policy: 'review-required' }),
    });
    const payload = await response.json();
    setMessage(payload.request ? 'Will draft created successfully' : 'Unable to create draft');
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-cyan-400">Create your digital will</p>
        <h1 className="mt-3 text-3xl font-semibold">Build a secure inheritance plan</h1>
        <div className="mt-6 flex gap-2">
          {[1, 2, 3, 4].map((value) => (
            <div key={value} className={`h-2 flex-1 rounded ${step >= value ? 'bg-cyan-500' : 'bg-slate-800'}`} />
          ))}
        </div>

        {step === 1 ? (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Step 1 — Add encrypted digital assets</h2>
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Asset name" value={assetForm.name} onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })} />
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Asset type" value={assetForm.assetType} onChange={(event) => setAssetForm({ ...assetForm, assetType: event.target.value })} />
            <select className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" value={assetForm.category} onChange={(event) => setAssetForm({ ...assetForm, category: event.target.value })}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Sensitive details" value={assetForm.value} onChange={(event) => setAssetForm({ ...assetForm, value: event.target.value })} />
            <button className="rounded bg-cyan-600 px-4 py-2 font-semibold text-white" onClick={addAsset}>Store encrypted asset</button>
            <div className="space-y-2">
              {assets.map((asset) => <div key={asset._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">{asset.name} • {asset.category}</div>)}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Step 2 — Assign trusted nominees</h2>
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Nominee name" value={nomineeForm.fullName} onChange={(event) => setNomineeForm({ ...nomineeForm, fullName: event.target.value })} />
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Nominee email" value={nomineeForm.email} onChange={(event) => setNomineeForm({ ...nomineeForm, email: event.target.value })} />
            <input className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Relationship" value={nomineeForm.relationship} onChange={(event) => setNomineeForm({ ...nomineeForm, relationship: event.target.value })} />
            <select className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2" value={nomineeForm.policy} onChange={(event) => setNomineeForm({ ...nomineeForm, policy: event.target.value })}>
              <option value="review-required">Review required</option>
              <option value="request-only">Request only</option>
              <option value="approve">Approve</option>
            </select>
            <button className="rounded bg-cyan-600 px-4 py-2 font-semibold text-white" onClick={addNominee}>Add nominee</button>
            <div className="space-y-2">
              {nominees.map((nominee) => <div key={nominee._id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">{nominee.contactInfo || nominee.relationship}</div>)}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Step 3 — Configure emergency policy</h2>
            <p className="text-sm text-slate-400">Policies are saved alongside each nominee and can be reviewed before release.</p>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              <p>Nominee access requires identity verification, government ID review, OTP validation, and trusted-device approval before any release.</p>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">Step 4 — Review and confirm</h2>
            <p className="text-sm text-slate-400">Your encrypted assets and nominees are ready for the emergency workflow.</p>
            <button className="rounded bg-cyan-600 px-4 py-2 font-semibold text-white" onClick={submitWill}>Confirm will draft</button>
            {message ? <p className="mt-3 text-sm text-slate-300">{message}</p> : null}
          </div>
        ) : null}

        <div className="mt-8 flex justify-between">
          <button className="rounded border border-slate-700 px-4 py-2 text-sm text-slate-300" onClick={() => setStep((value) => Math.max(1, value - 1))}>Back</button>
          <button className={`rounded px-4 py-2 text-sm font-semibold text-white ${canAdvance ? 'bg-cyan-600' : 'cursor-not-allowed bg-slate-700'}`} onClick={() => setStep((value) => Math.min(4, value + 1))} disabled={!canAdvance}>Next</button>
        </div>
      </div>
    </div>
  );
}
