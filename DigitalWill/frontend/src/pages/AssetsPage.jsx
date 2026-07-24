import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import api from '../services/api';

const categories = ['All', 'Bank', 'Social Media', 'Cloud Storage', 'Crypto', 'Documents', 'Photos', 'Videos'];
const categoryValues = ['Bank', 'Social Media', 'Cloud Storage', 'Crypto', 'Documents', 'Photos', 'Videos'];

const emptyForm = {
  name: '',
  assetType: '',
  category: 'Documents',
  securityLevel: 'medium',
  emergencyPolicy: 'review-required',
  value: '',
  notes: '',
  description: '',
};

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [filter, setFilter] = useState('All');
  const [editingId, setEditingId] = useState(null);
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm({ defaultValues: emptyForm });

  async function loadAssets() {
    try {
      const payload = await api.get('/api/vault/assets');
      setAssets(payload.assets || []);
    } catch (error) {
      setMessage(error.message || 'Unable to load assets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssets();
  }, []);

  const filteredAssets = useMemo(() => {
    if (filter === 'All') {
      return assets;
    }
    return assets.filter((asset) => asset.category === filter);
  }, [assets, filter]);

  async function saveAsset(data) {
    try {
      if (editingId) {
        await api.put(`/api/vault/assets/${editingId}`, data);
      } else {
        await api.post('/api/vault/assets', data);
      }
      reset(emptyForm);
      setEditingId(null);
      setMessage(editingId ? 'Asset updated.' : 'Asset added.');
      await loadAssets();
    } catch (error) {
      setMessage(error.message || 'Unable to save asset');
    }
  }

  async function deleteAsset(id) {
    try {
      const ok = await api.del(`/api/vault/assets/${id}`);
      if (ok.ok) {
        setMessage('Asset deleted.');
        await loadAssets();
      }
    } catch (error) {
      setMessage(error.message || 'Unable to delete asset');
    }
  }

  function startEdit(asset) {
    setEditingId(asset._id);
    setSelectedAssetId(asset._id);
    reset({
      name: asset.name || '',
      assetType: asset.assetType || '',
      category: asset.category || 'Documents',
      securityLevel: asset.securityLevel || 'medium',
      emergencyPolicy: asset.emergencyPolicy || 'review-required',
      value: '',
      notes: asset.metadata?.notes || '',
      description: asset.metadata?.description || '',
    });
  }

  function viewAsset(asset) {
    setSelectedAssetId(asset._id);
    setEditingId(null);
  }

  const selectedAsset = assets.find((asset) => asset._id === selectedAssetId) || null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF6B00]">Module 3</p>
              <h1 className="mt-2 text-2xl font-semibold text-[#111111]">Digital assets</h1>
              <p className="mt-2 text-sm text-slate-600">Manage your protected digital assets with encrypted records and category-based organization.</p>
            </div>
            <Link to="/dashboard" className="rounded-2xl border border-[#f2dfc8] px-4 py-2 text-sm font-medium text-slate-700">Back to dashboard</Link>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#111111]">{editingId ? 'Edit asset' : 'Add asset'}</h2>
              <span className="rounded-full bg-[#FFF6EC] px-3 py-1 text-sm text-[#FF6B00]">Encrypted</span>
            </div>
            <form className="mt-5 space-y-3" onSubmit={handleSubmit(saveAsset)}>
              <input className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" placeholder="Asset name" {...register('name', { required: true })} />
              <input className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" placeholder="Asset type" {...register('assetType', { required: true })} />
              <select className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" {...register('category')}>
                {categoryValues.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <select className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" {...register('securityLevel')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <input className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" placeholder="Private credentials or account details" {...register('value')} />
              <textarea className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" rows="3" placeholder="Optional notes" {...register('notes')} />
              <textarea className="w-full rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-3 outline-none" rows="2" placeholder="Short description" {...register('description')} />
              <div className="flex flex-wrap gap-3">
                <button className="rounded-2xl bg-[#FF6B00] px-4 py-3 font-semibold text-white" type="submit">{editingId ? 'Save changes' : 'Add asset'}</button>
                {editingId ? <button className="rounded-2xl border border-[#f2dfc8] px-4 py-3 font-medium text-slate-700" type="button" onClick={() => { setEditingId(null); reset(emptyForm); }}>Cancel</button> : null}
              </div>
            </form>
            {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}

            {selectedAsset ? (
              <div className="mt-6 rounded-[20px] border border-[#f2dfc8] bg-[#FFF6EC] p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-[#111111]">Asset detail</h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6B00]">{selectedAsset.category}</span>
                </div>
                <p className="mt-3 text-sm text-slate-700">{selectedAsset.metadata?.description || 'Protected asset details are stored securely and only visible to the authenticated owner.'}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p><span className="font-semibold text-[#111111]">Name:</span> {selectedAsset.name}</p>
                  <p><span className="font-semibold text-[#111111]">Type:</span> {selectedAsset.assetType}</p>
                  <p><span className="font-semibold text-[#111111]">Security:</span> {selectedAsset.securityLevel}</p>
                  <p><span className="font-semibold text-[#111111]">Notes:</span> {selectedAsset.metadata?.notes || 'No additional notes provided.'}</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#111111]">Saved assets</h2>
              <select className="rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] px-3 py-2 text-sm outline-none" value={filter} onChange={(event) => setFilter(event.target.value)}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div className="mt-4 space-y-3">
              {loading ? <p className="text-sm text-slate-600">Loading assets…</p> : null}
              {!loading && !filteredAssets.length ? <p className="text-sm text-slate-600">No assets yet. Add your first protected asset above.</p> : null}
              {filteredAssets.map((asset) => (
                <div key={asset._id} className="rounded-[20px] border border-[#f2dfc8] bg-[#FFF6EC] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#111111]">{asset.name}</p>
                      <p className="mt-1 text-sm text-slate-600">{asset.assetType} • {asset.category}</p>
                      <p className="mt-2 text-sm text-slate-600">{asset.metadata?.description || 'Protected asset stored securely.'}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6B00]">{asset.securityLevel}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="rounded-2xl border border-[#f2dfc8] bg-white px-3 py-2 text-sm font-medium text-slate-700" type="button" onClick={() => viewAsset(asset)}>View</button>
                    <button className="rounded-2xl border border-[#f2dfc8] bg-white px-3 py-2 text-sm font-medium text-slate-700" type="button" onClick={() => startEdit(asset)}>Edit</button>
                    <button className="rounded-2xl border border-[#f2dfc8] bg-white px-3 py-2 text-sm font-medium text-slate-700" type="button" onClick={() => deleteAsset(asset._id)}>Delete</button>
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
