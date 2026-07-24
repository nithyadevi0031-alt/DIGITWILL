import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000';

const categories = ['bank', 'cloud storage', 'email', 'social media', 'crypto', 'insurance', 'property', 'government docs', 'subscriptions', 'other'];
const policyOptions = [
  { value: 'review-required', label: 'Review required' },
  { value: 'request-only', label: 'Request only' },
  { value: 'approve', label: 'Approve' },
];

export default function CreateWillPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [assetForm, setAssetForm] = useState({ name: '', assetType: '', category: 'bank', securityLevel: 'high', emergencyPolicy: 'review-required', value: '' });
  const [nomineeForm, setNomineeForm] = useState({ name: '', email: '', relationship: '', waitingPeriodDays: 30, verificationRequired: true, approvalRequired: true, assetIds: [] });
  const [assets, setAssets] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('digital_will_token');
    if (!token) {
      navigate('/login');
      return;
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
    const payload = await fetch(`${API_BASE}/api/beneficiaries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: nomineeForm.name,
        relationship: nomineeForm.relationship,
        email: nomineeForm.email,
        phone: '',
        notes: 'Added during will creation',
        assetIds: nomineeForm.assetIds,
        accessPolicy: {
          waitingPeriodDays: nomineeForm.waitingPeriodDays,
          verificationRequired: nomineeForm.verificationRequired,
          approvalRequired: nomineeForm.approvalRequired,
        },
      }),
    }).then((response) => response.json());

    if (payload.beneficiary) {
      setNominees((current) => [payload.beneficiary, ...current]);
      setNomineeForm({ name: '', email: '', relationship: '', waitingPeriodDays: 30, verificationRequired: true, approvalRequired: true, assetIds: [] });
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
    <div className="min-h-screen bg-[#FFF6EC] px-4 py-8 text-[#111111] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-[#f2dfc8] bg-white p-6 shadow-[0_24px_80px_-28px_rgba(17,17,17,0.25)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF6B00]">Create your digital will</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#111111]">Build a secure inheritance plan</h1>
        <div className="mt-6 flex gap-2">
          {[1, 2, 3, 4].map((value) => (
            <div key={value} className={`h-2 flex-1 rounded-full ${step >= value ? 'bg-[#FF6B00]' : 'bg-[#f2dfc8]'}`} />
          ))}
        </div>

        {step === 1 ? (
          <div className="mt-8 space-y-4 rounded-[24px] border border-[#f2dfc8] bg-[#FFF6EC] p-5">
            <h2 className="text-xl font-semibold text-[#111111]">Step 1 — Add encrypted digital assets</h2>
            <input className="w-full rounded-2xl border border-[#f2dfc8] bg-white px-3 py-3 outline-none" placeholder="Asset name" value={assetForm.name} onChange={(event) => setAssetForm({ ...assetForm, name: event.target.value })} />
            <input className="w-full rounded-2xl border border-[#f2dfc8] bg-white px-3 py-3 outline-none" placeholder="Asset type" value={assetForm.assetType} onChange={(event) => setAssetForm({ ...assetForm, assetType: event.target.value })} />
            <select className="w-full rounded-2xl border border-[#f2dfc8] bg-white px-3 py-3 outline-none" value={assetForm.category} onChange={(event) => setAssetForm({ ...assetForm, category: event.target.value })}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <input className="w-full rounded-2xl border border-[#f2dfc8] bg-white px-3 py-3 outline-none" placeholder="Sensitive details" value={assetForm.value} onChange={(event) => setAssetForm({ ...assetForm, value: event.target.value })} />
            <button className="rounded-2xl bg-[#FF6B00] px-4 py-3 font-semibold text-white transition hover:opacity-90" onClick={addAsset}>Store encrypted asset</button>
            <div className="space-y-2">
              {assets.map((asset) => <div key={asset._id} className="rounded-2xl border border-[#f2dfc8] bg-white p-3 text-sm text-slate-600">{asset.name} • {asset.category}</div>)}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-8 space-y-4 rounded-[24px] border border-[#f2dfc8] bg-[#FFF6EC] p-5">
            <h2 className="text-xl font-semibold text-[#111111]">Step 2 — Add nominee and assign assets</h2>
            <div className="rounded-[20px] border border-[#f2dfc8] bg-white p-4 text-sm text-slate-600">
              <p className="font-semibold text-[#111111]">Choose the assets this nominee should receive.</p>
              <div className="mt-3 space-y-2">
                {assets.length ? assets.map((asset) => (
                  <label key={asset._id} className="flex items-center gap-2 rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-2">
                    <input type="checkbox" checked={nomineeForm.assetIds.includes(asset._id)} onChange={() => { const nextIds = nomineeForm.assetIds.includes(asset._id) ? nomineeForm.assetIds.filter((id) => id !== asset._id) : [...nomineeForm.assetIds, asset._id]; setNomineeForm({ ...nomineeForm, assetIds: nextIds }); }} />
                    <span>{asset.name} — {asset.category}</span>
                  </label>
                )) : <p>Add at least one asset in step 1 before assigning it here.</p>}
              </div>
            </div>
            <input className="w-full rounded-2xl border border-[#f2dfc8] bg-white px-3 py-3 outline-none" placeholder="Nominee name" value={nomineeForm.name} onChange={(event) => setNomineeForm({ ...nomineeForm, name: event.target.value })} />
            <input className="w-full rounded-2xl border border-[#f2dfc8] bg-white px-3 py-3 outline-none" placeholder="Nominee email" value={nomineeForm.email} onChange={(event) => setNomineeForm({ ...nomineeForm, email: event.target.value })} />
            <input className="w-full rounded-2xl border border-[#f2dfc8] bg-white px-3 py-3 outline-none" placeholder="Relationship" value={nomineeForm.relationship} onChange={(event) => setNomineeForm({ ...nomineeForm, relationship: event.target.value })} />
            <label className="block text-sm text-slate-600">
              Waiting period (days)
              <input className="mt-1 w-full rounded-2xl border border-[#f2dfc8] bg-white px-3 py-3 outline-none" type="number" min="0" value={nomineeForm.waitingPeriodDays} onChange={(event) => setNomineeForm({ ...nomineeForm, waitingPeriodDays: Number(event.target.value) })} />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={nomineeForm.verificationRequired} onChange={(event) => setNomineeForm({ ...nomineeForm, verificationRequired: event.target.checked })} />
              Verification required
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={nomineeForm.approvalRequired} onChange={(event) => setNomineeForm({ ...nomineeForm, approvalRequired: event.target.checked })} />
              Approval required
            </label>
            <button className="rounded-2xl bg-[#FF6B00] px-4 py-3 font-semibold text-white transition hover:opacity-90" onClick={addNominee}>Add nominee</button>
            <div className="space-y-2">
              {nominees.map((nominee) => <div key={nominee._id} className="rounded-2xl border border-[#f2dfc8] bg-white p-3 text-sm text-slate-600">{nominee.name} • {nominee.relationship} • {nominee.accessPolicy?.waitingPeriodDays || 30} days</div>)}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-8 space-y-4 rounded-[24px] border border-[#f2dfc8] bg-[#FFF6EC] p-5">
            <h2 className="text-xl font-semibold text-[#111111]">Step 3 — Configure emergency policy</h2>
            <p className="text-sm text-slate-600">Policies are saved alongside each nominee and can be reviewed before release.</p>
            <div className="rounded-[20px] border border-[#f2dfc8] bg-white p-4 text-sm text-slate-600">
              <p>Nominee access requires identity verification, government ID review, OTP validation, and trusted-device approval before any release.</p>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-8 space-y-4 rounded-[24px] border border-[#f2dfc8] bg-[#FFF6EC] p-5">
            <h2 className="text-xl font-semibold text-[#111111]">Step 4 — Review and confirm</h2>
            <p className="text-sm text-slate-600">Your encrypted assets and nominees are ready for the emergency workflow.</p>
            <button className="rounded-2xl bg-[#FF6B00] px-4 py-3 font-semibold text-white transition hover:opacity-90" onClick={submitWill}>Confirm will draft</button>
            {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <button className="rounded-2xl border border-[#f2dfc8] bg-white px-4 py-3 text-sm font-medium text-slate-700" onClick={() => setStep((value) => Math.max(1, value - 1))}>Back</button>
          <button className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white ${canAdvance ? 'bg-[#FF6B00]' : 'cursor-not-allowed bg-slate-400'}`} onClick={() => setStep((value) => Math.min(4, value + 1))} disabled={!canAdvance}>Next</button>
        </div>
      </div>
    </div>
  );
}
