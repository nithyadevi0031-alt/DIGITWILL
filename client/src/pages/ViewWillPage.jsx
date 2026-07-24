import React, { useState, useEffect } from 'react';
import { 
  Eye, User, Calendar, MapPin, UserCheck, MessageSquare, Users, 
  Landmark, FileText, Download, ShieldCheck, Clock, Mail, Phone,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export function ViewWillPage({ currentUser }) {
  const [will, setWill] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [assets, setAssets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [wRes, bRes, aRes, dRes] = await Promise.all([
          fetch('/api/wills', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/beneficiaries', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/assets', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/documents', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const wData = await wRes.json();
        const bData = await bRes.json();
        const aData = await aRes.json();
        const dData = await dRes.json();

        setWill((wData.wills || [])[0] || null);
        setBeneficiaries(bData.beneficiaries || []);
        setAssets(aData.assets || []);
        setDocuments(dData.documents || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#221B2A] text-white flex items-center justify-center">
        <p className="text-[#8D89AF] text-sm">Loading your Digital Will...</p>
      </div>
    );
  }

  if (!will) {
    return (
      <div className="min-h-screen bg-[#221B2A] text-white">
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="glass-card p-12 border border-white/10 bg-[#2B103D]/90 text-center space-y-4">
            <Eye className="w-14 h-14 text-[#8D89AF] mx-auto" />
            <h2 className="text-xl font-bold text-[#D2C8BC]">No Will Created Yet</h2>
            <p className="text-sm text-[#8D89AF]">Please create a will first using the "Create Will" page.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#221B2A] text-white">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {/* Page Header */}
        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#D2C8BC]">View Will: {will.willTitle}</h1>
              <p className="text-xs text-[#8D89AF]">Complete overview of your Digital Will.</p>
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-4">
          <h3 className="text-base font-bold text-[#D2C8BC] flex items-center gap-2">
            <User className="w-5 h-5 text-[#9A2CF2]" /> Owner Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Full Name</p>
              <p className="text-sm text-white font-medium">{will.fullName}</p>
            </div>
            <div className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Date of Birth</p>
              <p className="text-sm text-white font-medium">{will.dob}</p>
            </div>
            <div className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5 md:col-span-2">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Address</p>
              <p className="text-sm text-white font-medium">{will.address}</p>
            </div>
          </div>
        </div>

        {/* Executor Information */}
        <div className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-4">
          <h3 className="text-base font-bold text-[#D2C8BC] flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#9A2CF2]" /> Executor Information
          </h3>
          <div className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5">
            <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Executor Name</p>
            <p className="text-sm text-white font-medium">{will.executorName}</p>
          </div>
        </div>

        {/* Beneficiaries */}
        <div className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-4">
          <h3 className="text-base font-bold text-[#D2C8BC] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#9A2CF2]" /> Beneficiaries
          </h3>
          {beneficiaries.length === 0 ? (
            <p className="text-sm text-[#8D89AF] text-center py-6">No beneficiaries added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
                    <th className="p-3 font-semibold">Name</th>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Relationship</th>
                    <th className="p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {beneficiaries.map(b => (
                    <tr key={b._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold text-[#D2C8BC]">{b.name}</td>
                      <td className="p-3 text-white flex items-center gap-1"><Mail className="w-3 h-3 text-[#9A2CF2]" /> {b.email}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-[#731BB8]/20 border border-[#9A2CF2]/30 rounded-lg text-[#D2C8BC] text-xs">{b.relationship}</span></td>
                      <td className="p-3"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assets */}
        <div className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-4">
          <h3 className="text-base font-bold text-[#D2C8BC] flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#9A2CF2]" /> Assets
          </h3>
          {assets.length === 0 ? (
            <p className="text-sm text-[#8D89AF] text-center py-6">No assets added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
                    <th className="p-3 font-semibold">Asset Name</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold">Estimated Value</th>
                    <th className="p-3 font-semibold">Assigned Beneficiary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {assets.map(a => (
                    <tr key={a._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold text-[#D2C8BC]">{a.assetName}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-[#731BB8]/20 border border-[#9A2CF2]/30 rounded-lg text-[#D2C8BC] text-xs">{a.assetType}</span></td>
                      <td className="p-3 text-white font-medium">{a.estimatedValue}</td>
                      <td className="p-3 text-[#8D89AF]">{a.assignedBeneficiary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Uploaded Documents */}
        <div className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-4">
          <h3 className="text-base font-bold text-[#D2C8BC] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#9A2CF2]" /> Uploaded Documents
          </h3>
          {documents.length === 0 ? (
            <p className="text-sm text-[#8D89AF] text-center py-6">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {documents.map(d => (
                <div key={d._id} className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">{d.originalName}</p>
                    <p className="text-[10px] text-[#8D89AF]">{d.documentType} · Uploaded: {new Date(d.uploadDate).toLocaleDateString()}</p>
                  </div>
                  <a href={d.fileUrl} target="_blank" rel="noreferrer"
                    className="px-3 py-1.5 bg-[#731BB8]/30 hover:bg-[#9A2CF2]/30 border border-[#9A2CF2]/40 text-[#9A2CF2] text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> View/Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Special Instructions */}
        {will.specialInstructions && (
          <div className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-4">
            <h3 className="text-base font-bold text-[#D2C8BC] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#9A2CF2]" /> Special Instructions
            </h3>
            <div className="p-4 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-sm text-[#D2C8BC] whitespace-pre-wrap leading-relaxed">{will.specialInstructions}</p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="glass-card p-6 border border-emerald-500/30 bg-emerald-500/5 space-y-4">
          <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" /> Will Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-3 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Created</p>
              <p className="text-sm text-white font-medium">{new Date(will.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="p-3 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Updated</p>
              <p className="text-sm text-white font-medium">{new Date(will.updatedAt).toLocaleDateString()}</p>
            </div>
            <div className="p-3 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Beneficiaries</p>
              <p className="text-xl text-[#9A2CF2] font-black">{beneficiaries.length}</p>
            </div>
            <div className="p-3 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Assets</p>
              <p className="text-xl text-[#9A2CF2] font-black">{assets.length}</p>
            </div>
            <div className="p-3 bg-[#221B2A]/80 rounded-xl border border-white/5">
              <p className="text-[10px] text-[#8D89AF] uppercase font-semibold tracking-wider mb-1">Documents</p>
              <p className="text-xl text-[#9A2CF2] font-black">{documents.length}</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
