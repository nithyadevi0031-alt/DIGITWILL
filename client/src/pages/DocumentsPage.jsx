import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileUp, Trash2, Loader2, AlertCircle, CheckCircle, Download, Eye, File, X 
} from 'lucide-react';

const DOCUMENT_TYPES = [
  'Aadhaar Card', 'PAN Card', 'Passport', 'Driving License',
  'Property Documents', 'Insurance Documents', 'Bank Statements', 'Other Supporting Documents'
];

export function DocumentsPage({ currentUser }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('');

  const token = localStorage.getItem('token');

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccess('');

    if (!selectedFile || !documentType) {
      setError('Please select a file and document type.');
      setUploading(false);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('documentType', documentType);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Unable to upload document.');
        setUploading(false);
        return;
      }

      setSuccess('Document uploaded successfully.');
      setSelectedFile(null);
      setDocumentType('');
      setShowForm(false);
      fetchDocuments();
    } catch (err) {
      setError('Unable to process your request. Please try again.');
    }
    setUploading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSuccess('Document deleted successfully.');
      fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-[#221B2A] text-white">
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Page Header */}
        <div className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#731BB8] to-[#9A2CF2] rounded-xl text-white">
              <FileUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#D2C8BC]">Document Vault</h1>
              <p className="text-xs text-[#8D89AF]">Upload and manage your important documents securely.</p>
            </div>
          </div>

          <button onClick={() => setShowForm(true)}
            className="py-3 px-5 btn-primary text-sm font-bold flex items-center gap-2 shrink-0">
            <FileUp className="w-4 h-4" /> Upload Document
          </button>
        </div>

        {/* Messages */}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" /> {success}
          </motion.div>
        )}

        {/* Upload Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border border-[#9A2CF2]/30 bg-[#2B103D]/90 space-y-4 relative">
            <button onClick={() => { setShowForm(false); setSelectedFile(null); setDocumentType(''); setError(''); }}
              className="absolute top-5 right-5 p-2 text-[#8D89AF] hover:text-white rounded-xl hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#D2C8BC]">Upload New Document</h3>

            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" /> {error}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">Document Type <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <File className="w-5 h-5 absolute left-3.5 top-3.5 text-[#8D89AF]" />
                  <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} required
                    className="w-full pl-11 pr-4 py-3 bg-[#221B2A]/80 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#9A2CF2] transition-colors text-sm appearance-none">
                    <option value="" disabled className="bg-[#221B2A] text-[#8D89AF]">Select document type</option>
                    {DOCUMENT_TYPES.map(t => <option key={t} value={t} className="bg-[#221B2A] text-white">{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D89AF] uppercase tracking-wider mb-1.5">File <span className="text-rose-400">*</span></label>
                <div className="p-4 bg-[#221B2A]/80 border-2 border-dashed border-white/10 rounded-xl text-center hover:border-[#9A2CF2]/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-input').click()}>
                  <input id="file-input" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files[0])} />
                  {selectedFile ? (
                    <div className="text-sm text-[#D2C8BC]">
                      <File className="w-8 h-8 text-[#9A2CF2] mx-auto mb-2" />
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-[10px] text-[#8D89AF]">{formatSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-[#8D89AF]">
                      <FileUp className="w-8 h-8 text-[#8D89AF] mx-auto mb-2" />
                      <p>Click to select a file</p>
                      <p className="text-[10px]">PDF, JPG, PNG, DOC (Max 10MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => { setShowForm(false); setSelectedFile(null); setDocumentType(''); setError(''); }}
                  className="w-1/3 py-3 bg-white/5 hover:bg-white/10 text-[#8D89AF] font-semibold rounded-xl text-sm transition-colors">Cancel</button>
                <button type="submit" disabled={uploading} className="w-2/3 py-3 btn-primary text-sm flex items-center justify-center gap-2 font-bold">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><FileUp className="w-4 h-4" /> Upload Document</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Documents Table */}
        <div className="glass-card border border-white/10 bg-[#2B103D]/90 overflow-hidden">
          <div className="p-5 border-b border-white/10">
            <h3 className="text-base font-bold text-[#D2C8BC]">Your Documents</h3>
            <p className="text-xs text-[#8D89AF]">All uploaded documents in your secure vault.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#221B2A]/80 border-b border-white/10 text-[#8D89AF] uppercase text-[10px] tracking-wider">
                  <th className="p-4 font-semibold">Document Type</th>
                  <th className="p-4 font-semibold">File Name</th>
                  <th className="p-4 font-semibold">Size</th>
                  <th className="p-4 font-semibold">Upload Date</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan="5" className="p-8 text-center text-[#8D89AF]">Loading documents...</td></tr>
                ) : documents.length === 0 ? (
                  <tr><td colSpan="5" className="p-12 text-center text-[#8D89AF] text-sm font-medium">No documents uploaded yet.</td></tr>
                ) : (
                  documents.map(d => (
                    <tr key={d._id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-[#731BB8]/20 border border-[#9A2CF2]/30 rounded-lg text-[#D2C8BC] font-medium text-xs">{d.documentType}</span>
                      </td>
                      <td className="p-4 whitespace-nowrap font-medium text-white text-sm">{d.originalName}</td>
                      <td className="p-4 whitespace-nowrap text-[#8D89AF]">{formatSize(d.fileSize)}</td>
                      <td className="p-4 whitespace-nowrap text-[#8D89AF] font-mono text-[11px]">{new Date(d.uploadDate).toLocaleDateString()}</td>
                      <td className="p-4 whitespace-nowrap text-right space-x-2">
                        <a href={d.fileUrl} target="_blank" rel="noreferrer"
                          className="px-3 py-1.5 bg-[#731BB8]/30 hover:bg-[#9A2CF2]/30 border border-[#9A2CF2]/40 text-[#9A2CF2] text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> View
                        </a>
                        <button onClick={() => handleDelete(d._id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
