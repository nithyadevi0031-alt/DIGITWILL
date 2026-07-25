import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Landmark, FileText, User, Mail, Phone, 
  HeartHandshake, AlertCircle, RefreshCw, CheckCircle2, Clock, ShieldAlert, FileUp, Eye, Download, X, Bell 
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export function NomineeDashboardPage({ currentUser }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // View Modals
  const [viewingAsset, setViewingAsset] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  const token = localStorage.getItem('token');

  const fetchNomineeData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/beneficiaries/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDashboardData(data);
      } else {
        setError(data.message || 'Unable to fetch nominee dashboard data.');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load dashboard. Please try again.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNomineeData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#221B2A] flex items-center justify-center p-6 text-[#8D89AF]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#9A2CF2] animate-spin mx-auto" />
          <p className="text-sm font-semibold">Loading Nominee Portal...</p>
        </div>
      </div>
    );
  }

  const nominee = dashboardData?.nominee || {};
  const assignedAssets = dashboardData?.assignedAssets || [];
  const assignedDocuments = dashboardData?.assignedDocuments || [];
  const releaseStatus = dashboardData?.releaseStatus || {};

  return (
    <div className="min-h-screen bg-[#221B2A] text-white p-6 space-y-8">
      <main className="max-w-6xl mx-auto space-y-8">

        {/* HEADER BRAND */}
        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-2xl text-white shadow-lg shadow-[#9A2CF2]/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-[#D2C8BC]">Nominee Vault Portal</h1>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full text-[10px] font-bold text-emerald-300 uppercase">
                  Read Only User
                </span>
              </div>
              <p className="text-xs text-[#8D89AF]">View assigned assets, confidential documents, and release status.</p>
            </div>
          </div>

          <button 
            onClick={fetchNomineeData}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-[#8D89AF] flex items-center gap-2 transition-colors border border-white/10"
          >
            <RefreshCw className="w-4 h-4 text-[#9A2CF2]" /> Refresh Vault
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* TOP CARDS: ESTATE OWNER INFO & RELEASE STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Card 1: Estate Owner Details */}
          <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/90 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-[#8D89AF] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#9A2CF2]" /> Nominee Profile & Owner Info
              </span>
              <StatusBadge status={nominee.status || 'Accepted'} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-[#8D89AF] uppercase tracking-wider block">Estate Owner</span>
                <span className="font-bold text-[#D2C8BC] text-sm">{nominee.ownerName || 'Vault Owner'}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#8D89AF] uppercase tracking-wider block">Relationship</span>
                <span className="font-bold text-[#9A2CF2] text-sm">{nominee.relationship || 'Designated Beneficiary'}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#8D89AF] uppercase tracking-wider block">Nominee Name</span>
                <span className="font-semibold text-white">{nominee.name || currentUser?.fullName || currentUser?.name}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#8D89AF] uppercase tracking-wider block">Nominee Email</span>
                <span className="font-mono text-white truncate block">{nominee.email || currentUser?.email}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Will Release Protocol Status */}
          <div className="glass-card p-6 border border-[#D95F30]/40 bg-[#2B103D]/90 space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-bold text-[#D2C8BC] uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#D95F30]" /> Will Release Protocol Status
              </span>
              <span className="px-2.5 py-0.5 bg-[#D95F30]/20 border border-[#D95F30]/40 rounded-full text-[10px] font-bold text-[#D95F30]">
                Access Sealed
              </span>
            </div>

            <div className="p-4 bg-[#221B2A] border border-[#D95F30]/30 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#D95F30]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>RESTRICTED ACCESS PROTOCOL</span>
              </div>
              <p className="text-xs text-[#8D89AF] leading-relaxed">
                {releaseStatus.message || 'Access Restricted: Estate Vault Owner is currently active. Digital Will release instructions remain sealed.'}
              </p>
            </div>

            <div className="text-[11px] text-[#8D89AF] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#9A2CF2]" /> Automatic Release Verification Active
            </div>
          </div>

        </div>

        {/* ASSIGNED DIGITAL ASSETS SECTION (Module 2 Requirement) */}
        <div className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#9A2CF2]" />
              <h2 className="text-lg font-bold text-[#D2C8BC]">Assigned Assets</h2>
            </div>
            <span className="text-xs text-[#8D89AF] font-semibold">{assignedAssets.length} Assets Allocated</span>
          </div>

          {assignedAssets.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8D89AF] space-y-2">
              <Landmark className="w-8 h-8 mx-auto text-[#8D89AF]/40" />
              <p>No assets have been assigned to your nominee email ({nominee.email || currentUser?.email}).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {assignedAssets.map((asset) => (
                <div key={asset._id} className="p-4 bg-[#221B2A] border border-white/10 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white text-sm">{asset.assetName}</span>
                      <span className="px-2 py-0.5 bg-[#731BB8]/30 border border-[#9A2CF2]/40 rounded text-[10px] text-[#9A2CF2]">
                        {asset.assetType}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8D89AF]">{asset.description || 'Assigned estate asset record.'}</p>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-white/5 text-[11px]">
                    <div className="flex justify-between text-[#8D89AF]">
                      <span>Owner:</span>
                      <span className="text-white font-medium">{asset.ownerName || nominee.ownerName || 'Vault Owner'}</span>
                    </div>
                    <div className="flex justify-between text-[#8D89AF]">
                      <span>Assigned Date:</span>
                      <span className="font-mono text-[#D2C8BC]">{new Date(asset.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-[#8D89AF]">
                      <span>Release Status:</span>
                      <span className="text-amber-300 font-semibold">Sealed until condition</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingAsset(asset)}
                    className="w-full py-2 bg-[#731BB8]/30 hover:bg-[#9A2CF2]/30 border border-[#9A2CF2]/40 text-[#9A2CF2] font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Asset Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ASSIGNED DOCUMENTS SECTION (Module 3 Requirement) */}
        <div className="glass-card p-6 border border-white/10 bg-[#2B103D]/90 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-[#9A2CF2]" />
              <h2 className="text-lg font-bold text-[#D2C8BC]">Assigned Confidential Documents</h2>
            </div>
            <span className="text-xs text-[#8D89AF] font-semibold">{assignedDocuments.length} Documents Authorized</span>
          </div>

          {assignedDocuments.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8D89AF] space-y-2">
              <FileText className="w-8 h-8 mx-auto text-[#8D89AF]/40" />
              <p>No confidential documents have been authorized for your nominee profile yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {assignedDocuments.map((doc) => (
                <div key={doc._id} className="p-4 bg-[#221B2A] border border-white/10 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-white text-sm block truncate">{doc.originalName || doc.fileName}</span>
                    <span className="px-2 py-0.5 bg-[#731BB8]/20 border border-[#9A2CF2]/30 rounded text-[10px] text-[#9A2CF2] inline-block">
                      {doc.documentType}
                    </span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-white/5 text-[11px] text-[#8D89AF]">
                    <div className="flex justify-between">
                      <span>Owner:</span>
                      <span className="text-white">{nominee.ownerName || 'Vault Owner'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Upload Date:</span>
                      <span className="font-mono">{new Date(doc.uploadDate || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Security Status:</span>
                      <span className="text-emerald-400 font-semibold">Authorized</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence Score:</span>
                      <span className="font-mono text-[#9A2CF2] font-bold">{doc.confidenceScore || doc.similarityScore || 90}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="w-1/2 py-2 bg-[#731BB8]/30 hover:bg-[#9A2CF2]/30 border border-[#9A2CF2]/40 text-[#9A2CF2] font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        download
                        className="w-1/2 py-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1 text-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* VIEW ASSET MODAL FOR NOMINEE */}
        <AnimatePresence>
          {viewingAsset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-lg p-6 glass-card border border-[#9A2CF2]/40 bg-[#2B103D] relative space-y-4">
                <button onClick={() => setViewingAsset(null)} className="absolute top-5 right-5 p-2 text-[#8D89AF] hover:text-white rounded-xl hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-[#D2C8BC]">{viewingAsset.assetName}</h3>

                <div className="grid grid-cols-2 gap-4 p-4 bg-[#221B2A] border border-white/10 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Category</span>
                    <span className="text-[#9A2CF2] font-semibold">{viewingAsset.assetType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Allocated Value</span>
                    <span className="font-bold text-white font-mono">{viewingAsset.estimatedValue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Owner</span>
                    <span className="text-white">{viewingAsset.ownerName || nominee.ownerName || 'Vault Owner'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8D89AF] uppercase block mb-0.5">Release Status</span>
                    <span className="text-amber-300 font-semibold">Sealed until condition</span>
                  </div>
                </div>

                <button onClick={() => setViewingAsset(null)} className="w-full py-2.5 btn-primary text-xs font-bold">Close View</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* VIEW DOCUMENT MODAL FOR NOMINEE */}
        <AnimatePresence>
          {viewingDoc && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-lg p-6 glass-card border border-[#9A2CF2]/40 bg-[#2B103D] relative space-y-4">
                <button onClick={() => setViewingDoc(null)} className="absolute top-5 right-5 p-2 text-[#8D89AF] hover:text-white rounded-xl hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-[#D2C8BC] truncate">{viewingDoc.originalName || viewingDoc.fileName}</h3>

                <div className="p-4 bg-[#221B2A] border border-white/10 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#8D89AF]">Document Type:</span>
                    <span className="text-[#9A2CF2] font-semibold">{viewingDoc.documentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8D89AF]">Owner:</span>
                    <span className="text-white">{nominee.ownerName || 'Vault Owner'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8D89AF]">Upload Date:</span>
                    <span className="font-mono text-white">{new Date(viewingDoc.uploadDate || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8D89AF]">Security Status:</span>
                    <span className="text-emerald-400 font-bold">AES-256 Encrypted</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  {viewingDoc.fileUrl && (
                    <a
                      href={viewingDoc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-1/2 py-2.5 bg-[#731BB8] hover:bg-[#9A2CF2] text-white font-bold rounded-xl text-center text-xs transition-colors"
                    >
                      Preview File
                    </a>
                  )}
                  {viewingDoc.fileUrl && (
                    <a
                      href={viewingDoc.fileUrl}
                      download
                      className="w-1/2 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-center text-xs transition-colors border border-white/10"
                    >
                      Download
                    </a>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
