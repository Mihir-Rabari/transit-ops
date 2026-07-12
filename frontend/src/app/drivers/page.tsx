'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Search, 
  ShieldAlert, 
  X, 
  UserPlus, 
  Calendar,
  Phone,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Upload
} from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
}

interface DocumentRecord {
  id: string;
  title: string;
  docType: string;
  s3Url: string;
  expiryDate: string | null;
  createdAt: string;
}

export default function DriversPage() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [licenseNum, setLicenseNum] = useState('');
  const [licenseCat, setLicenseCat] = useState('');
  const [licenseExp, setLicenseExp] = useState('');
  const [contactNum, setContactNum] = useState('');
  const [safetyScore, setSafetyScore] = useState('100');
  const [formError, setFormError] = useState<string | null>(null);

  // Search/Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Driver Documents Modal State
  const [selectedDriverForDocs, setSelectedDriverForDocs] = useState<Driver | null>(null);
  const [driverDocs, setDriverDocs] = useState<DocumentRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('License');
  const [docExpiry, setDocExpiry] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/drivers');
      setDrivers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !licenseNum || !licenseCat || !licenseExp || !contactNum) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      await apiRequest('/drivers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          licenseNumber: licenseNum,
          licenseCategory: licenseCat,
          licenseExpiryDate: licenseExp,
          contactNumber: contactNum,
          safetyScore
        })
      });

      // Reset form and refetch
      setName('');
      setLicenseNum('');
      setLicenseCat('');
      setLicenseExp('');
      setContactNum('');
      setSafetyScore('100');
      setShowAddForm(false);
      fetchDrivers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add driver');
    }
  };

  // Documents loading & uploading
  const openDocsModal = async (driver: Driver) => {
    setSelectedDriverForDocs(driver);
    setDocsLoading(true);
    setDocUploadError(null);
    try {
      const docs = await apiRequest(`/drivers/${driver.id}/documents`);
      setDriverDocs(docs);
    } catch (err: any) {
      console.error('Failed to load driver documents:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocUploadError(null);

    if (!selectedDriverForDocs || !docTitle || !docFile) {
      setDocUploadError('Title and File are required');
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('docType', docType);
      if (docExpiry) formData.append('expiryDate', docExpiry);
      formData.append('file', docFile);

      await apiRequest(`/drivers/${selectedDriverForDocs.id}/documents`, {
        method: 'POST',
        body: formData
      });

      // Clear upload form and reload documents
      setDocTitle('');
      setDocExpiry('');
      setDocFile(null);
      
      const docs = await apiRequest(`/drivers/${selectedDriverForDocs.id}/documents`);
      setDriverDocs(docs);
    } catch (err: any) {
      setDocUploadError(err.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50';
      case 'ON_TRIP':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50';
      case 'OFF_DUTY':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border-slate-200/50';
      case 'SUSPENDED':
        return 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200/50';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getLicenseExpiryInfo = (expiryDateStr: string) => {
    const expiryDate = new Date(expiryDateStr);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Expired', class: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200/50' };
    } else if (diffDays <= 30) {
      return { text: `Expiring soon (${diffDays}d)`, class: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50' };
    } else {
      return { text: 'Valid', class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50' };
    }
  };

  // Filter and Sort
  const filteredDrivers = drivers
    .filter((d) => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                            d.licenseNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter ? d.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        return b.safetyScore - a.safetyScore;
      }
      return a.name.localeCompare(b.name);
    });

  const isFleetManager = user?.role === 'FLEET_MANAGER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Driver Registry</h2>
          <p className="text-sm text-slate-400 dark:text-dark-muted">Verify eligibility and manage professional document scans.</p>
        </div>
        {isFleetManager && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Driver Profile</span>
          </button>
        )}
      </div>

      {/* Add Driver Form Panel */}
      {showAddForm && isFleetManager && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-md animate-fadeIn">
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
            <h3 className="font-bold text-slate-800 dark:text-white">Add Driver Profile</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-500 border border-red-200/50">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddDriver} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Marcus Miller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">License Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. DL-12048912"
                value={licenseNum}
                onChange={(e) => setLicenseNum(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">License Category/Class *</label>
              <input
                type="text"
                required
                placeholder="e.g. Class A Commercial"
                value={licenseCat}
                onChange={(e) => setLicenseCat(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">License Expiry Date *</label>
              <input
                type="date"
                required
                value={licenseExp}
                onChange={(e) => setLicenseExp(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. +1 555-0199"
                value={contactNum}
                onChange={(e) => setContactNum(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Safety Compliance Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="100"
                value={safetyScore}
                onChange={(e) => setSafetyScore(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-end sm:col-span-2 md:col-span-3">
              <button
                type="submit"
                className="w-full sm:w-auto rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Create Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Filter Panel */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by driver name or license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="OFF_DUTY">Off Duty</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
            >
              <option value="name">Name</option>
              <option value="score">Safety Score (High-Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent" />
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-dark-border dark:bg-dark-card">
          <ShieldAlert className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-md font-bold text-slate-700 dark:text-slate-300">No drivers matching your query</h3>
          <p className="mt-1 text-xs text-slate-400 dark:text-dark-muted">Verify your filters or search constraints.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-dark-border dark:bg-dark-card shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-dark-border text-left text-sm">
            <thead className="bg-slate-50/70 dark:bg-slate-900/40 text-xs font-semibold text-slate-400 dark:text-dark-muted uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Driver Profile</th>
                <th className="px-6 py-4">License Credentials</th>
                <th className="px-6 py-4">License Expiry Status</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Safety Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {filteredDrivers.map((d) => {
                const expiryInfo = getLicenseExpiryInfo(d.licenseExpiryDate);
                return (
                  <tr key={d.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-850 font-semibold text-slate-600 dark:text-slate-300">
                          {d.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{d.name}</p>
                          <p className="text-xs text-slate-400 dark:text-dark-muted">Driver Profile</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{d.licenseNumber}</p>
                      <p className="text-2xs text-slate-400 dark:text-dark-muted">{d.licenseCategory}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center">
                          <Calendar size={12} className="mr-1 text-slate-400" />
                          {new Date(d.licenseExpiryDate).toLocaleDateString()}
                        </span>
                        <span className={`inline-flex self-start rounded border px-1.5 py-0.5 text-3xs font-bold uppercase ${expiryInfo.class}`}>
                          {expiryInfo.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-dark-muted font-medium">
                      <div className="flex items-center">
                        <Phone size={12} className="mr-1.5 text-slate-400" />
                        {d.contactNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-bold text-sm ${d.safetyScore >= 85 ? 'text-emerald-500' : d.safetyScore >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                          {d.safetyScore}
                        </span>
                        <span className="text-2xs text-slate-400">/100</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(d.status)}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => openDocsModal(d)}
                        className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                        title="Upload/View Driver Credentials Documents"
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Driver Documents Modal */}
      {selectedDriverForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-card border border-slate-100 dark:border-dark-border">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Driver Credentials & Documents</h3>
                <p className="text-xs text-slate-400 dark:text-dark-muted">
                  Audit scan records for: {selectedDriverForDocs.name}
                </p>
              </div>
              <button onClick={() => setSelectedDriverForDocs(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {docUploadError && (
              <div className="mb-4 rounded bg-red-50 p-2.5 text-xs font-semibold text-red-500">
                {docUploadError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Document upload form */}
              <div className="border-r border-slate-100 dark:border-dark-border pr-0 md:pr-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attach Scan</h4>
                
                <form onSubmit={handleDocUpload} className="space-y-3">
                  <div>
                    <label className="block text-3xs font-bold text-slate-400 uppercase mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. License scan, Medical cert"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs font-bold text-slate-400 uppercase mb-1">Document Type *</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
                    >
                      <option value="License">Driving License Scan</option>
                      <option value="Medical">Medical Check Certificate</option>
                      <option value="Certification">Training Certification</option>
                      <option value="Other">Other Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-3xs font-bold text-slate-400 uppercase mb-1">Expiry Date (optional)</label>
                    <input
                      type="date"
                      value={docExpiry}
                      onChange={(e) => setDocExpiry(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-3xs font-bold text-slate-400 uppercase mb-1">Select File *</label>
                    <input
                      type="file"
                      required
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-3xs file:bg-slate-100 hover:file:bg-slate-200 dark:file:bg-slate-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingDoc}
                    className="w-full flex items-center justify-center space-x-1 rounded bg-brand-600 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    <Upload size={12} />
                    <span>{uploadingDoc ? 'Uploading...' : 'Upload File'}</span>
                  </button>
                </form>
              </div>

              {/* Documents list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded Scans</h4>

                {docsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-r-transparent" />
                  </div>
                ) : driverDocs.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-dark-muted text-center py-12">No files uploaded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {driverDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-900/10 border border-slate-100 dark:border-dark-border text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-slate-700 dark:text-slate-300 truncate" title={doc.title}>
                            {doc.title}
                          </p>
                          <span className="inline-block text-4xs font-mono font-bold bg-slate-200/50 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500">
                            {doc.docType}
                          </span>
                        </div>
                        <a
                          href={doc.s3Url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-brand-600 hover:underline shrink-0"
                        >
                          Open
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
