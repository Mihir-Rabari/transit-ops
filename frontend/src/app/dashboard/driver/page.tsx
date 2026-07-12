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
      <div className="ops-panel p-5">
        <div>
          <h2 className="font-display font-bold text-scale-xl" style={{ color: 'var(--color-text-primary)' }}>
            Driver Terminal: {user.name}
          </h2>
          <p className="telemetry text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Company ID: {user.companyId}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-r-transparent" style={{ borderColor: 'var(--color-signal-amber)' }} />
        </div>
      ) : error ? (
        <div className="ops-panel p-6 text-center" style={{ borderColor: 'rgba(255, 92, 92, 0.3)' }}>
          <AlertCircle className="mx-auto h-10 w-10 mb-3" style={{ color: 'var(--color-signal-red)' }} />
          <h3 className="text-scale-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>Failed to connect driver account</h3>
          <p className="mt-1 text-scale-sm" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        </div>
      ) : !driverProfile ? (
        // Unlinked profile empty state
        <div className="ops-panel p-6 text-center" style={{ borderColor: 'rgba(255, 176, 32, 0.3)' }}>
          <ShieldAlert className="mx-auto h-10 w-10 mb-3" style={{ color: 'var(--color-signal-amber)' }} />
          <h3 className="text-scale-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>Account Configuration Incomplete</h3>
          <p className="mt-1 text-scale-sm" style={{ color: 'var(--color-text-muted)' }}>
            Your login account is not linked to any Driver Profile yet. Please contact an Administrator to bind your account to a profile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Main Action Area (Trips) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Current Active Trip Card */}
            <div className="ops-panel p-5">
              <h3 className="text-scale-md font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Route style={{ color: 'var(--color-signal-green)' }} size={18} />
                Ongoing Transit Assignment
              </h3>

              {activeTrip ? (
                <div className="ops-panel p-4" style={{ background: 'var(--color-surface-raised)' }}>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <div>
                      <span className="status-badge status-badge--amber">DISPATCHED</span>
                      <h4 className="mt-2 font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {activeTrip.source} &rarr; {activeTrip.destination}
                      </h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Vehicle: <span className="telemetry">{activeTrip.vehicle.name} ({activeTrip.vehicle.registrationNumber})</span>
                      </p>
                    </div>

                    <div className="flex sm:flex-col gap-2 self-start">
                      <button
                        onClick={() => setShowCompleteModal(activeTrip.id)}
                        className="btn-primary text-xs"
                      >
                        <CheckCircle2 size={14} />
                        <span>Complete</span>
                      </button>
                      <button
                        onClick={() => handleCancel(activeTrip.id)}
                        className="btn-ghost text-xs"
                      >
                        <XCircle size={14} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 pt-3 text-xs" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Cargo Weight</p>
                      <p className="telemetry font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{activeTrip.cargoWeightKg} kg</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Planned Distance</p>
                      <p className="telemetry font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{activeTrip.plannedDistanceKm} km</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
                  No active trip dispatched currently.
                </p>
              )}
            </div>

            {/* Pending Assignment Card */}
            <div className="ops-panel p-5">
              <h3 className="text-scale-md font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Calendar style={{ color: 'var(--color-signal-amber)' }} size={18} />
                Pending Assigned Trips
              </h3>

              {assignedTrip ? (
                <div className="ops-panel p-4" style={{ background: 'var(--color-surface-raised)' }}>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    <div>
                      <span className="status-badge status-badge--slate">ASSIGNED (DRAFT)</span>
                      <h4 className="mt-2 font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {assignedTrip.source} &rarr; {assignedTrip.destination}
                      </h4>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Vehicle: <span className="telemetry">{assignedTrip.vehicle.name} ({assignedTrip.vehicle.registrationNumber})</span>
                      </p>
                    </div>

                    <div className="flex sm:flex-col gap-2 self-start">
                      <button
                        onClick={() => handleDispatch(assignedTrip.id)}
                        disabled={!!activeTrip}
                        className="btn-primary text-xs"
                        style={!!activeTrip ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                      >
                        <Play size={14} />
                        <span>Start Dispatch</span>
                      </button>
                      <button
                        onClick={() => handleCancel(assignedTrip.id)}
                        className="btn-ghost text-xs"
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>

                  {activeTrip && (
                    <p className="text-[10px] font-semibold mt-2" style={{ color: 'var(--color-signal-amber)' }}>
                      * You cannot start this trip until your current dispatched trip is completed or cancelled.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
                  No pending assignments on your schedule.
                </p>
              )}
            </div>

            {/* Document Uploads List */}
            <div className="ops-panel p-5">
              <h3 className="text-scale-md font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <FileText style={{ color: 'var(--color-signal-amber)' }} size={18} />
                My Verified Documents
              </h3>

              {documents.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
                  No documents uploaded yet. Submit files below.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-start justify-between p-3 rounded-lg" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{doc.title}</p>
                        <p className="text-[10px] mt-0.5 font-sans uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>{doc.docType}</p>
                        {doc.expiryDate && (
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <a
                        href={doc.s3Url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold shrink-0 pl-2 hover:underline"
                        style={{ color: 'var(--color-signal-amber)' }}
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
            <div className="ops-panel p-5">
              <h3 className="text-scale-md font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <User style={{ color: 'var(--color-signal-amber)' }} size={18} />
                Driver Profile Card
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg font-bold text-lg" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}>
                    {driverProfile.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{driverProfile.name}</h4>
                    <p className="text-xs telemetry mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{driverProfile.status}</p>
                  </div>
                </div>

                <div className="pt-4 space-y-2 text-xs" style={{ borderTop: '1px solid var(--color-border)' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>License Number</span>
                    <span className="telemetry font-semibold" style={{ color: 'var(--color-text-primary)' }}>{driverProfile.licenseNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>License Class</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{driverProfile.licenseCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>License Expiry</span>
                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      {new Date(driverProfile.licenseExpiryDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-muted)' }}>Contact Number</span>
                    <span className="telemetry font-semibold" style={{ color: 'var(--color-text-primary)' }}>{driverProfile.contactNumber}</span>
                  </div>
                </div>

                <div className="rounded-lg p-3 flex items-center gap-2" style={{ background: 'rgba(62, 207, 142, 0.08)', border: '1px solid rgba(62, 207, 142, 0.2)' }}>
                  <Award style={{ color: 'var(--color-signal-green)' }} className="shrink-0" size={18} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-signal-green)' }}>Safety Compliance Score</p>
                    <p className="text-lg font-extrabold mt-0.5 telemetry" style={{ color: 'var(--color-signal-green)' }}>{driverProfile.safetyScore}/100</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Upload Form */}
            <div className="ops-panel p-5">
              <h3 className="text-scale-md font-display font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <Upload style={{ color: 'var(--color-signal-amber)' }} size={18} />
                Upload Driver Document
              </h3>

              {uploadError && (
                <div className="mb-3 rounded p-2 text-[10px] font-semibold" style={{ background: 'rgba(255, 92, 92, 0.1)', color: 'var(--color-signal-red)' }}>
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleFileUpload} className="space-y-3.5">
                <div>
                  <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Document Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. License scan, Medical cert"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-xs focus:outline-none"
                    style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Document Type *</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-xs focus:outline-none"
                    style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="License">Driving License Scan</option>
                    <option value="Medical">Medical Check Certificate</option>
                    <option value="Certification">Training Certification</option>
                    <option value="Other">Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={docExpiry}
                    onChange={(e) => setDocExpiry(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-xs focus:outline-none"
                    style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Attach File (PDF, PNG, JPG) *</label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    className="w-full text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="w-full btn-primary"
                  style={uploadingDoc ? { opacity: 0.5 } : undefined}
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
          <div className="w-full max-w-sm ops-panel p-5">
            <h4 className="font-display font-semibold text-scale-md mb-2" style={{ color: 'var(--color-text-primary)' }}>Finalize Transit Log</h4>
            <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>Input the verified final mileage and fuel consumed.</p>

            {completeError && (
              <div className="mb-3 rounded p-2.5 text-xs font-semibold" style={{ background: 'rgba(255, 92, 92, 0.1)', color: 'var(--color-signal-red)' }}>
                {completeError}
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Actual Distance Covered (km) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 120.5"
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div>
                <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Fuel Consumed (Liters) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 24.8"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                  style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Complete Trip
                </button>
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(null)}
                  className="flex-1 btn-ghost"
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
