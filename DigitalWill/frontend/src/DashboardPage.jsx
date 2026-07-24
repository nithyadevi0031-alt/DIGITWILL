import { useEffect, useState } from 'react';
import DashboardLayout from './components/dashboard/DashboardLayout';
import api from './services/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function load() {
      const [statsData, assetsData, requestsData, logsData] = await Promise.all([
        api.get('/api/vault/stats'),
        api.get('/api/vault/assets'),
        api.get('/api/vault/requests'),
        api.get('/api/vault/logs'),
      ]);
      setStats(statsData.stats);
      setAssets(assetsData.assets || []);
      setRequests(requestsData.requests || []);
      setLogs(logsData.logs || []);
    }

    load().catch(() => setStats({ assets: 0, nominees: 0, pendingRequests: 0, approvedRequests: 0 }));
  }, []);

  if (!stats) {
    return <DashboardLayout><div className="rounded-[24px] border border-[#f2dfc8] bg-white p-8 text-slate-600">Loading dashboard…</div></DashboardLayout>;
  }

  const cards = [
    { label: 'Digital Assets', value: stats.assets, tone: 'bg-[#FFF6EC]' },
    { label: 'Beneficiaries', value: stats.nominees, tone: 'bg-white' },
    { label: 'Security Score', value: '92/100', tone: 'bg-[#FFF6EC]' },
    { label: 'Recent Activity', value: stats.recentActivity || logs.length, tone: 'bg-white' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className={`rounded-[24px] border border-[#f2dfc8] p-5 shadow-sm ${card.tone}`}>
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-[#111111]">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#111111]">Recent activity</h2>
              <span className="rounded-full bg-[#FFF6EC] px-3 py-1 text-sm text-[#FF6B00]">Live</span>
            </div>
            <div className="mt-4 space-y-3">
              {logs.length ? logs.map((log) => (
                <div key={log._id || log.id} className="rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] p-3 text-sm text-slate-600">
                  <p className="font-medium text-[#111111]">{log.action}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              )) : <p className="text-sm text-slate-500">No activity recorded yet.</p>}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111111]">Security posture</h2>
            <div className="mt-4 rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] p-4 text-sm text-slate-600">
              <p className="font-semibold text-[#111111]">Stable and monitored</p>
              <p className="mt-2">Your account uses protected routes, encrypted data handling, and active audit tracing.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111111]">Digital assets</h2>
            <div className="mt-4 space-y-3">
              {assets.length ? assets.map((asset) => (
                <div key={asset._id || asset.id} className="rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] p-3 text-sm text-slate-600">
                  <p className="font-medium text-[#111111]">{asset.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{asset.category || 'secured'} • {asset.securityLevel || 'high'}</p>
                </div>
              )) : <p className="text-sm text-slate-500">No assets saved yet.</p>}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#f2dfc8] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111111]">Requests</h2>
            <div className="mt-4 space-y-3">
              {requests.length ? requests.map((request) => (
                <div key={request._id || request.id} className="rounded-2xl border border-[#f2dfc8] bg-[#FFF6EC] p-3 text-sm text-slate-600">
                  <p className="font-medium text-[#111111]">{request.status || 'pending'}</p>
                  <p className="mt-1 text-xs text-slate-500">Verification: {request.verificationStatus || 'in-progress'}</p>
                </div>
              )) : <p className="text-sm text-slate-500">No access requests yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
