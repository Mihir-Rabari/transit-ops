'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Route, 
  User, 
  Calendar, 
  ShieldAlert, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Upload, 
  FileText, 
  Award,
  AlertCircle
} from 'lucide-react';

interface Trip {
  id: string;
  source: string;
  destination: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  actualDistanceKm: number | null;
  fuelConsumedL: number | null;
  status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  dispatchedAt: string | null;
  completedAt: string | null;
  vehicle: {
    registrationNumber: string;
    name: string;
  };
}

interface DriverProfile {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: string;
}

interface DocumentRecord {
  id: string;
  title: string;
  docType: string;
  s3Url: string;
  expiryDate: string | null;
  createdAt: string;
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Completion modal state
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null); // tripId
  const [actualDistance, setActualDistance] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Document upload state
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('License');
  const [docExpiry, setDocExpiry] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Protect client side
  useEffect(() => {
    if (user && user.role !== 'DRIVER') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch active driver profile & trips in parallel
      const tripsData = await apiRequest('/trips');
      setTrips(tripsData);

      // Find driver matching this user's email or linked userId
      const driversList = await apiRequest('/drivers');
      const matched = driversList.find((d: any) => d.userId === user.id);
      
      if (matched) {
        setDriverProfile(matched);
        // Fetch driver's uploaded documents
        const docs = await apiRequest(`/drivers/${matched.id}/documents`);
        setDocuments(docs);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load driver profile and trips');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'DRIVER') {
      loadData();
    }
  }, [user, loadData]);

  const handleDispatch = async (tripId: string) => {
    if (!confirm('Are you ready to dispatch this trip? This marks you and the vehicle as ON_TRIP.')) return;
    try {
      await apiRequest(`/trips/${tripId}/dispatch`, { method: 'PATCH' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch trip');
    }
  };

  const handleCancel = async (tripId: string) => {
    if (!confirm('Are you sure you want to cancel this trip assignment?')) return;
    try {
      await apiRequest(`/trips/${tripId}/cancel`, { method: 'PATCH' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel trip');
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompleteError(null);

    if (!showCompleteModal || !actualDistance || !fuelConsumed) {
      setCompleteError('Please fill in both fields');
      return;
    }

    try {
      await apiRequest(`/trips/${showCompleteModal}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({
          actualDistanceKm: parseFloat(actualDistance),
          fuelConsumedL: parseFloat(fuelConsumed)
        })
      });

      setShowCompleteModal(null);
      setActualDistance('');
      setFuelConsumed('');
      loadData();
    } catch (err: any) {
      setCompleteError(err.message || 'Failed to complete trip');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!driverProfile) return;
    if (!docTitle || !docFile) {
      setUploadError('Document title and file are required');
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('docType', docType);
      if (docExpiry) formData.append('expiryDate', docExpiry);
      formData.append('file', docFile);

      await apiRequest(`/drivers/${driverProfile.id}/documents`, {
        method: 'POST',
        body: formData
      });

      // Clear upload form and reload documents
      setDocTitle('');
      setDocExpiry('');
      setDocFile(null);
      
      const docs = await apiRequest(`/drivers/${driverProfile.id}/documents`);
      setDocuments(docs);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (user?.role !== 'DRIVER') {
    return null;
  }

  const activeTrip = trips.find(t => t.status === 'DISPATCHED');
  const assignedTrip = trips.find(t => t.status === 'DRAFT');

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600 p-6 text-white shadow-lg">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Driver Terminal: {user.name}</h2>
          <p className="mt-1 text-sm text-emerald-100 font-mono">Company ID: {user.companyId}</p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/20 blur-2xl" />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center dark:border-red-950/20 dark:bg-red-950/10">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Failed to connect driver account</h3>
          <p className="mt-1 text-sm text-red-600 dark:text-red-500">{error}</p>
        </div>
      ) : !driverProfile ? (
        // Unlinked profile empty state
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900/30 dark:bg-amber-950/10">
          <ShieldAlert className="mx-auto h-12 w-12 text-amber-500 mb-3" />
          <h3 className="text-md font-bold text-amber-800 dark:text-amber-400">Account Configuration Incomplete</h3>
          <p className="mt-1 text-sm text-amber-600 dark:text-amber-500">
            Your login account is not linked to any Driver Profile yet. Please contact an Administrator to bind your account to a profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Main Action Area (Trips) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Current Active Trip Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
              <h3 className="text-md font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <Route className="mr-2 text-emerald-500" size={18} />
                Ongoing Transit Assignment
              </h3>

              {activeTrip ? (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/20 p-4 dark:border-emerald-950/30 dark:bg-emerald-950/5">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center rounded-md bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 text-2xs font-semibold text-emerald-700">
                        DISPATCHED
                      </span>
                      <h4 className="mt-2 font-bold text-slate-800 dark:text-white">
                        {activeTrip.source} &rarr; {activeTrip.destination}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-dark-muted mt-1">
                        Vehicle: {activeTrip.vehicle.name} ({activeTrip.vehicle.registrationNumber})
                      </p>
                    </div>

                    <div className="flex sm:flex-col gap-2 self-start">
                      <button
                        onClick={() => setShowCompleteModal(activeTrip.id)}
                        className="flex items-center justify-center space-x-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
                      >
                        <CheckCircle2 size={14} />
                        <span>Complete</span>
                      </button>
                      <button
                        onClick={() => handleCancel(activeTrip.id)}
                        className="flex items-center justify-center space-x-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <XCircle size={14} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-dark-border pt-3 text-xs">
                    <div>
                      <p className="text-slate-400">Cargo Weight</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{activeTrip.cargoWeightKg} kg</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Planned Distance</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{activeTrip.plannedDistanceKm} km</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-dark-muted text-center py-6">
                  No active trip dispatched currently.
                </p>
              )}
            </div>

            {/* Pending Assignment Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
              <h3 className="text-md font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <Calendar className="mr-2 text-blue-500" size={18} />
                Pending Assigned Trips
              </h3>

              {assignedTrip ? (
                <div className="rounded-lg border border-blue-100 bg-blue-50/10 p-4 dark:border-blue-900/10">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <div>
                      <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200/50 px-2 py-0.5 text-2xs font-semibold text-blue-700">
                        ASSIGNED (DRAFT)
                      </span>
                      <h4 className="mt-2 font-bold text-slate-800 dark:text-white">
                        {assignedTrip.source} &rarr; {assignedTrip.destination}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-dark-muted mt-1">
                        Vehicle: {assignedTrip.vehicle.name} ({assignedTrip.vehicle.registrationNumber})
                      </p>
                    </div>

                    <div className="flex sm:flex-col gap-2 self-start">
                      <button
                        onClick={() => handleDispatch(assignedTrip.id)}
                        disabled={!!activeTrip}
                        className="flex items-center justify-center space-x-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        <Play size={14} />
                        <span>Start Dispatch</span>
                      </button>
                      <button
                        onClick={() => handleCancel(assignedTrip.id)}
                        className="flex items-center justify-center space-x-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                  
                  {activeTrip && (
                    <p className="text-2xs text-amber-500 font-semibold mt-2">
                      * You cannot start this trip until your current dispatched trip is completed or cancelled.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-dark-muted text-center py-6">
                  No pending assignments on your schedule.
                </p>
              )}
            </div>

            {/* Document Uploads List */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
              <h3 className="text-md font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <FileText className="mr-2 text-purple-500" size={18} />
                My Verified Documents
              </h3>

              {documents.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-dark-muted text-center py-6">
                  No documents uploaded yet. Submit files below.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-start justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/30 dark:border-dark-border dark:bg-slate-900/10">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{doc.title}</p>
                        <p className="text-3xs text-slate-400 dark:text-dark-muted mt-0.5 font-sans uppercase font-bold">{doc.docType}</p>
                        {doc.expiryDate && (
                          <p className="text-3xs text-slate-400 dark:text-dark-muted mt-0.5">
                            Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <a
                        href={doc.s3Url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-brand-600 hover:underline shrink-0 pl-2"
                      >
                        View file
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Profile Sidebar Info */}
          <div className="space-y-6">
            
            {/* Driver Profile Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
              <h3 className="text-md font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <User className="mr-2 text-indigo-500" size={18} />
                Driver Profile Card
              </h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 font-bold text-lg">
                    {driverProfile.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{driverProfile.name}</h4>
                    <p className="text-xs text-slate-400 dark:text-dark-muted font-sans uppercase font-bold">{driverProfile.status}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-dark-border pt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">License Number</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{driverProfile.licenseNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">License Class</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{driverProfile.licenseCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">License Expiry</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {new Date(driverProfile.licenseExpiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Contact Number</span>
                    <span className="font-semibold text-slate-800 dark:text-white">{driverProfile.contactNumber}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-emerald-50/50 p-3 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/10 flex items-center space-x-2">
                  <Award className="text-emerald-600 shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="text-3xs font-bold uppercase tracking-wider text-emerald-700">Safety Compliance Score</p>
                    <p className="text-lg font-extrabold text-emerald-600 mt-0.5">{driverProfile.safetyScore}/100</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload Form */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
              <h3 className="text-md font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <Upload className="mr-2 text-brand-500" size={18} />
                Upload Driver Document
              </h3>

              {uploadError && (
                <div className="mb-3 rounded bg-red-50 p-2 text-3xs font-semibold text-red-500">
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleFileUpload} className="space-y-3.5">
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. License scan, Medical cert"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase mb-1">Document Type *</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
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
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase mb-1">Attach File (PDF, PNG, JPG) *</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-2xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-lg bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:bg-brand-400 transition-all shadow-sm"
                >
                  <Upload size={14} />
                  <span>{uploadingDoc ? 'Uploading...' : 'Upload Document'}</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-dark-card border border-slate-100 dark:border-dark-border">
            <h4 className="font-bold text-slate-800 dark:text-white mb-2">Finalize Transit Log</h4>
            <p className="text-xs text-slate-400 dark:text-dark-muted mb-4">Input the verified final mileage and fuel consumed.</p>

            {completeError && (
              <div className="mb-3 rounded bg-red-50 p-2.5 text-xs font-semibold text-red-500">
                {completeError}
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-3xs font-bold text-slate-400 uppercase mb-1">Actual Distance Covered (km) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 120.5"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-400 uppercase mb-1">Fuel Consumed (Liters) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 24.8"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Complete Trip
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(null)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
