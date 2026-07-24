import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import api from '../services/api';

export default function DigitalWillPage() {
  const [will, setWill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [conditions, setConditions] = useState({ waitingPeriodDays: 30, adminApprovalRequired: true, notes: '' });

  async function loadWill() {
    try {
      const payload = await api.get('/api/digital-wills');
      setWill(payload.will || null);
      setConditions({
        waitingPeriodDays: payload.will?.releaseConditions?.waitingPeriodDays || 30,
        adminApprovalRequired: payload.will?.releaseConditions?.adminApprovalRequired ?? true,
        notes: payload.will?.releaseConditions?.notes || 'Review and identity verification required.',
      });
    } catch (error) {
      setMessage(error.message || 'Unable to load digital will');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWill();
  }, []);

  async function saveConditions(event) {
    event.preventDefault();
    try {
      const payload = await api.put('/api/digital-wills', { releaseConditions: conditions });
      setWill(payload.will || null);
      setMessage('Release conditions updated.');
    } catch (error) {
      setMessage(error.message || 'Unable to update conditions');
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF6B00]">Module 5</p>
              <h1 className="mt-2 text-2xl font-semibold text-[#111111]">Digital will preview</h1>
              <p className="mt-2 text-sm text-slate-600">A read-only summary of your linked assets, beneficiaries, and release conditions.</p>
            </div>
            <Link to="/dashboard" className="rounded-2xl border border-[#f2dfc8] px-4 py-2 text-sm font-medium text-slate-700">Back to dashboard</Link>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
          {loading ? <p className="text-sm text-slate-600">Loading digital will…</p> : null}
          {message ? <p className="mt-2 text-sm text-slate-600">{message}</p> : null}
          {will ? (
            <div className="space-y-6">
              <div className="rounded-[20px] border border-[#f2dfc8] bg-[#FFF6EC] p-5">
                <h2 className="text-lg font-semibold text-[#111111]">Owner</h2>
                <p className="mt-2 text-sm text-slate-600">{will.ownerName}</p>
              </div>

              <div className="rounded-[20px] border border-[#f2dfc8] bg-[#FFF6EC] p-5">
                <h2 className="text-lg font-semibold text-[#111111]">Release conditions</h2>
                <form className="mt-4 space-y-3" onSubmit={saveConditions}>
                  <label className="block text-sm text-slate-600">
                    Waiting period (days)
                    <input className="mt-1 w-full rounded-2xl border border-[#f2dfc8] bg-white px-3 py-3 outline-none" type="number" min="0" value={conditions.waitingPeriodDays} onChange={(event) => setConditions({ ...conditions, waitingPeriodDays: Number(event.target.value) })} />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={conditions.adminApprovalRequired} onChange={(event) => setConditions({ ...conditions, adminApprovalRequired: event.target.checked })} />
                    Admin approval required
                  </label>
                  <label className="block text-sm text-slate-600">
                    Notes
                    <textarea className="mt-1 w-full rounded-2xl border border-[#f2dfc8] bg-white px-3 py-3 outline-none" rows="3" value={conditions.notes} onChange={(event) => setConditions({ ...conditions, notes: event.target.value })} />
                  </label>
                  <button className="rounded-2xl bg-[#FF6B00] px-4 py-3 font-semibold text-white" type="submit">Save conditions</button>
                </form>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-[20px] border border-[#f2dfc8] bg-[#FFF6EC] p-5">
                  <h2 className="text-lg font-semibold text-[#111111]">Linked assets</h2>
                  {will.assets?.length ? (
                    <div className="mt-3 space-y-2">
                      {will.assets.map((asset) => (
                        <div key={asset._id} className="rounded-2xl border border-[#f2dfc8] bg-white p-3 text-sm text-slate-600">
                          <p className="font-semibold text-[#111111]">{asset.name}</p>
                          <p className="mt-1">{asset.category} • {asset.securityLevel}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">No assets linked yet. Add one from the Assets page to see it here.</p>
                  )}
                </div>

                <div className="rounded-[20px] border border-[#f2dfc8] bg-[#FFF6EC] p-5">
                  <h2 className="text-lg font-semibold text-[#111111]">Assigned beneficiaries</h2>
                  {will.beneficiaries?.length ? (
                    <div className="mt-3 space-y-2">
                      {will.beneficiaries.map((beneficiary) => (
                        <div key={beneficiary._id} className="rounded-2xl border border-[#f2dfc8] bg-white p-3 text-sm text-slate-600">
                          <p className="font-semibold text-[#111111]">{beneficiary.name}</p>
                          <p className="mt-1">{beneficiary.relationship}</p>
                          <p className="mt-1">Access policy: {beneficiary.accessPolicy?.waitingPeriodDays || 30} days • {beneficiary.accessPolicy?.verificationRequired ? 'verification' : 'no verification'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">No beneficiaries linked yet. Add one to start building your will.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}
