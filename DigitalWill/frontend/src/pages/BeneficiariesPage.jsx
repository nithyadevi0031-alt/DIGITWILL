import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import api from '../services/api';

const emptyForm = {
  name: '',
  relationship: '',
  phone: '',
  email: '',
  notes: '',
};

export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyForm });

  async function loadBeneficiaries() {
    try {
      const [beneficiaryPayload, assetPayload] = await Promise.all([api.get('/api/beneficiaries'), api.get('/api/vault/assets')]);
      setBeneficiaries(beneficiaryPayload.beneficiaries || []);
      setAssets(assetPayload.assets || []);
    } catch (error) {
      setMessage(error.message || 'Unable to load beneficiaries');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  async function saveBeneficiary(data) {
    try {
      const errors = [];
      if (!data.name?.trim()) errors.push('Name is required');
      if (!data.relationship?.trim()) errors.push('Relationship is required');
      if (data.phone && !/^\+?[0-9\s()-]{7,15}$/.test(data.phone)) errors.push('Phone number must look valid');
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('Email must be valid');
      if (!selectedAssetIds.length) errors.push('Select at least one asset');

      if (errors.length) {
        setMessage(errors[0]);
        return;
      }

      const payload = editingId
        ? await api.put(`/api/beneficiaries/${editingId}`, { ...data, assetIds: selectedAssetIds })
        : await api.post('/api/beneficiaries', { ...data, assetIds: selectedAssetIds });

      reset(emptyForm);
      setSelectedAssetIds([]);
      setEditingId(null);
      setMessage(editingId ? 'Beneficiary updated.' : 'Beneficiary added.');
      await loadBeneficiaries();
    } catch (error) {
      setMessage(error.message || 'Unable to save beneficiary');
    }
  }

  async function deleteBeneficiary(id) {
    if (!window.confirm('Remove this beneficiary from the will?')) {
      return;
    }

    try {
      const ok = await api.del(`/api/beneficiaries/${id}`);
      if (ok.ok) {
        setMessage('Beneficiary deleted.');
        await loadBeneficiaries();
      }
    } catch (error) {
      setMessage(error.message || 'Unable to delete beneficiary');
    }
  }

  function startEdit(beneficiary) {
    setEditingId(beneficiary._id);
    setSelectedAssetIds(beneficiary.assetIds || []);
    reset({
      name: beneficiary.name || '',
      relationship: beneficiary.relationship || '',
      phone: beneficiary.phone || '',
      email: beneficiary.email || '',
      notes: beneficiary.notes || '',
    });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF6B00]">Module 4</p>
              <h1 className="mt-2 text-2xl font-semibold text-[#111111]">Beneficiaries</h1>
              <p className="mt-2 text-sm text-slate-600">Add trusted beneficiaries and keep their contact details ready for your digital will.</p>
            </div>
            <Link to="/dashboard" className="rounded-2xl border border-[#f2dfc8] px-4 py-2 text-sm font-medium text-slate-700">Back to dashboard</Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111111]">{editingId ? 'Edit beneficiary' : 'Add beneficiary'}</h2>
            <form className="mt-5 space-y-3" onSubmit={handleSubmit(saveBeneficiary)}>
              <input className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" placeholder="Beneficiary name" {...register('name', { required: true })} />
              <input className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" placeholder="Relationship" {...register('relationship', { required: true })} />
              <input className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" placeholder="Phone" {...register('phone')} />
              <input className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" placeholder="Email" {...register('email')} />
              <textarea className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" rows="3" placeholder="Notes" {...register('notes')} />
              <div className="rounded-[20px] border border-[#f2dfc8] bg-[#FFF6EC] p-4">
                <p className="text-sm font-semibold text-[#111111]">Assign assets</p>
                <div className="mt-3 space-y-2">
                  {assets.length ? assets.map((asset) => (
                    <label key={asset._id} className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" checked={selectedAssetIds.includes(asset._id)} onChange={() => setSelectedAssetIds((current) => current.includes(asset._id) ? current.filter((id) => id !== asset._id) : [...current, asset._id])} />
                      <span>{asset.name}</span>
                    </label>
                  )) : <p className="text-sm text-slate-600">Add an asset first to assign it here.</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-2xl bg-[#FF6B00] px-4 py-3 font-semibold text-white" type="submit">{editingId ? 'Save changes' : 'Add beneficiary'}</button>
                {editingId ? <button className="rounded-2xl border border-[#f2dfc8] px-4 py-3 font-medium text-slate-700" type="button" onClick={() => { setEditingId(null); setSelectedAssetIds([]); reset(emptyForm); }}>Cancel</button> : null}
              </div>
            </form>
            {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
          </div>

          <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111111]">Saved beneficiaries</h2>
            <div className="mt-4 space-y-3">
              {loading ? <p className="text-sm text-slate-600">Loading beneficiaries…</p> : null}
              {!loading && !beneficiaries.length ? <p className="text-sm text-slate-600">No beneficiaries yet.</p> : null}
              {beneficiaries.map((beneficiary) => (
                <div key={beneficiary._id} className="rounded-[20px] border border-[#f2dfc8] bg-[#FFF6EC] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#111111]">{beneficiary.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{beneficiary.relationship}</p>
                      <p className="mt-2 text-sm text-slate-600">{beneficiary.email || beneficiary.phone || 'Contact details pending.'}</p>
                      <p className="mt-2 text-sm text-slate-600">Assigned assets: {beneficiary.assetIds?.length ? assets.filter((asset) => beneficiary.assetIds.includes(asset._id)).map((asset) => asset.name).join(', ') : 'None yet'}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6B00]">{beneficiary.status || 'active'}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="rounded-2xl border border-[#f2dfc8] bg-white px-3 py-2 text-sm font-medium text-slate-700" type="button" onClick={() => startEdit(beneficiary)}>Edit</button>
                    <button className="rounded-2xl border border-[#f2dfc8] bg-white px-3 py-2 text-sm font-medium text-slate-700" type="button" onClick={() => deleteBeneficiary(beneficiary._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
