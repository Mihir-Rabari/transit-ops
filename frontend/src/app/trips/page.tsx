'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { SkeletonKanban } from '../components/Skeleton';
import { 
  Plus, 
  X, 
  MapPin, 
  Truck, 
  User as UserIcon, 
  Route, 
  Weight, 
  CheckCircle2, 
  Play, 
  XCircle,
  Clock,
  Gauge,
  FileText,
  Upload,
  Eye
} from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  registrationNumber: string;
  maxLoadCapacityKg: number;
}

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
}

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
  cancelledAt: string | null;
  createdAt: string;
  vehicle: {
    registrationNumber: string;
    name: string;
  };
  driver: {
    name: string;
  };
}

interface DocumentRecord {
  id: string;
  title: string;
  docType: string;
  s3Url: string;
  createdAt: string;
}

export default function TripsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [availVehicles, setAvailVehicles] = useState<Vehicle[]>([]);
  const [availDrivers, setAvailDrivers] = useState<Driver[]>([]);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Completion Modal State
  const [selectedTripForComplete, setSelectedTripForComplete] = useState<Trip | null>(null);
  const [actualDistance, setActualDistance] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [completionError, setCompletionError] = useState<string | null>(null);

  // Document Management Modal State
  const [selectedTripForDocs, setSelectedTripForDocs] = useState<Trip | null>(null);
  const [tripDocs, setTripDocs] = useState<DocumentRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('BOL');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/trips');
      setTrips(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableAssets = async () => {
    try {
      const vehicles = await apiRequest('/vehicles/available');
      const drivers = await apiRequest('/drivers/available');
      setAvailVehicles(vehicles);
      setAvailDrivers(drivers);
    } catch (err) {
      console.error('Error fetching available assets:', err);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    if (showAddForm) {
      fetchAvailableAssets();
    }
  }, [showAddForm]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!source || !destination || !vehicleId || !driverId || !cargoWeight || !plannedDistance) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      await apiRequest('/trips', {
        method: 'POST',
        body: JSON.stringify({
          source,
          destination,
          vehicleId,
          driverId,
          cargoWeightKg: cargoWeight,
          plannedDistanceKm: plannedDistance
        })
      });

      // Clear Form and reload
      setSource('');
      setDestination('');
      setVehicleId('');
      setDriverId('');
      setCargoWeight('');
      setPlannedDistance('');
      setShowAddForm(false);
      fetchTrips();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create trip');
    }
  };

  const handleDispatch = async (tripId: string) => {
    try {
      await apiRequest(`/trips/${tripId}/dispatch`, { method: 'PATCH' });
      fetchTrips();
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch trip');
    }
  };

  const handleCancel = async (tripId: string) => {
    if (!confirm('Are you sure you want to cancel this assignment?')) return;
    try {
      await apiRequest(`/trips/${tripId}/cancel`, { method: 'PATCH' });
      fetchTrips();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel trip');
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompletionError(null);

    if (!selectedTripForComplete) return;

    try {
      await apiRequest(`/trips/${selectedTripForComplete.id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({
          actualDistanceKm: actualDistance,
          fuelConsumedL: fuelConsumed
        })
      });

      setSelectedTripForComplete(null);
      setActualDistance('');
      setFuelConsumed('');
      fetchTrips();
    } catch (err: any) {
      setCompletionError(err.message || 'Failed to complete trip');
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, trip: Trip) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: trip.id, status: trip.status }));
  };

  const handleCardDrop = async (e: React.DragEvent, targetStatus: Trip['status']) => {
    e.preventDefault();
    const dataJson = e.dataTransfer.getData('text/plain');
    if (!dataJson) return;

    try {
      const { id, status: originalStatus } = JSON.parse(dataJson) as { id: string; status: Trip['status'] };

      if (originalStatus === targetStatus) return;

      if (targetStatus === 'DISPATCHED') {
        if (originalStatus === 'DRAFT') {
          await handleDispatch(id);
        } else {
          alert('Only DRAFT trips can be dispatched.');
        }
      } else if (targetStatus === 'COMPLETED') {
        if (originalStatus === 'DISPATCHED') {
          const tripToComplete = trips.find(t => t.id === id);
          if (tripToComplete) {
            setSelectedTripForComplete(tripToComplete);
          }
        } else {
          alert('Only DISPATCHED trips can be completed.');
        }
      } else if (targetStatus === 'CANCELLED') {
        if (originalStatus === 'DRAFT' || originalStatus === 'DISPATCHED') {
          await handleCancel(id);
        } else {
          alert('Cannot cancel a completed trip.');
        }
      } else if (targetStatus === 'DRAFT') {
        alert('Cannot revert a trip back to DRAFT once transitioned.');
      }
    } catch (err) {
      console.error('Drop handling failed:', err);
    }
  };

  // Documents loading & uploading
  const openDocsModal = async (trip: Trip) => {
    setSelectedTripForDocs(trip);
    setDocsLoading(true);
    setDocUploadError(null);
    try {
      const docs = await apiRequest(`/trips/${trip.id}/documents`);
      setTripDocs(docs);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocUploadError(null);

    if (!selectedTripForDocs || !docTitle || !docFile) {
      setDocUploadError('Title and File are required');
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('docType', docType);
      formData.append('file', docFile);

      await apiRequest(`/trips/${selectedTripForDocs.id}/documents`, {
        method: 'POST',
        body: formData
      });

      // Clear upload form and reload documents
      setDocTitle('');
      setDocFile(null);
      
      const docs = await apiRequest(`/trips/${selectedTripForDocs.id}/documents`);
      setTripDocs(docs);
    } catch (err: any) {
      setDocUploadError(err.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Group trips by status
  const draftTrips = trips.filter(t => t.status === 'DRAFT');
  const dispatchedTrips = trips.filter(t => t.status === 'DISPATCHED');
  const completedTrips = trips.filter(t => t.status === 'COMPLETED');
  const cancelledTrips = trips.filter(t => t.status === 'CANCELLED');

  const isFleetManager = user?.role === 'FLEET_MANAGER' || user?.role === 'ADMIN';
  const isDriverOrManager = user?.role === 'FLEET_MANAGER' || user?.role === 'ADMIN' || user?.role === 'DRIVER';

  return (
    <div className="space-y-6 animate-slideUp">
      
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-scale-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>Trip Management</h2>
          <p className="text-scale-sm" style={{ color: 'var(--color-text-muted)' }}>Drag and drop cards to change trip statuses natively.</p>
        </div>
        {isFleetManager && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Create Draft Trip</span>
          </button>
        )}
      </div>

      {/* Create Trip Form Panel */}
      {showAddForm && isFleetManager && (
        <div className="ops-panel p-5 animate-fadeIn">
          <div className="mb-4 flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h3 className="font-display font-semibold text-scale-md" style={{ color: 'var(--color-text-primary)' }}>Create Draft Trip</h3>
            <button onClick={() => setShowAddForm(false)} style={{ color: 'var(--color-text-muted)' }}>
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded p-3 text-xs font-semibold" style={{ background: 'rgba(255, 92, 92, 0.1)', color: 'var(--color-signal-red)', border: '1px solid rgba(255, 92, 92, 0.2)' }}>
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateTrip} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Source / Origin *</label>
              <input
                type="text"
                required
                placeholder="e.g. Chicago Depot"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Destination *</label>
              <input
                type="text"
                required
                placeholder="e.g. Detroit Fulfillment Center"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Select Available Vehicle *</label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <option value="">-- Choose Vehicle --</option>
                {availVehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.registrationNumber}) [Max: {v.maxLoadCapacityKg}kg]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Select Available Driver *</label>
              <select
                required
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <option value="">-- Choose Driver --</option>
                {availDrivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.licenseNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Cargo Weight (kg) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 5400"
                value={cargoWeight}
                onChange={(e) => setCargoWeight(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Planned Distance (km) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 460"
                value={plannedDistance}
                onChange={(e) => setPlannedDistance(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none"
                style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div className="flex items-end sm:col-span-2 md:col-span-3">
              <button type="submit" className="btn-primary">
                Create Draft Trip
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trips Kanban Board */}
      {loading ? (
        <SkeletonKanban />
      ) : trips.length === 0 ? (
        <div className="ops-panel p-8 text-center" style={{ borderStyle: 'dashed' }}>
          <Route className="mx-auto h-10 w-10 mb-3" style={{ color: 'var(--color-border)' }} />
          <h3 className="text-scale-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>No trips logged yet</h3>
          <p className="mt-1 text-scale-sm" style={{ color: 'var(--color-text-muted)' }}>Register a vehicle and a driver first to create a trip.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Column 1: Drafts */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleCardDrop(e, 'DRAFT')}
            className="ops-panel p-3 space-y-4 min-h-[500px] col-header--draft"
          >
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)', fontFamily: "'Space Grotesk'" }}>
                Draft <span className="telemetry text-xs" style={{ color: 'var(--color-text-muted)' }}>({draftTrips.length})</span>
              </span>
              <span className="status-badge status-badge--slate">Draft</span>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {draftTrips.map((t) => (
                <div 
                  key={t.id} 
                  draggable={isDriverOrManager}
                  onDragStart={(e) => handleDragStart(e, t)}
                  className="ops-panel p-4 space-y-3 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="telemetry text-[10px] truncate max-w-[100px]" style={{ color: 'var(--color-text-muted)' }}>ID: {t.id.substring(0, 8)}</span>
                    <span className="status-badge status-badge--slate">Draft</span>
                  </div>
                  <div>
                    <p className="telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Route</p>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      <MapPin size={12} style={{ color: 'var(--color-signal-amber)', flexShrink: 0 }} />
                      <span className="truncate">{t.source}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>&rarr;</span>
                      <span className="truncate">{t.destination}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] p-2 rounded" style={{ background: 'var(--color-surface-raised)' }}>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Vehicle</p>
                      <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{t.vehicle.name}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Driver</p>
                      <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{t.driver.name}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Cargo</p>
                      <p className="telemetry font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.cargoWeightKg.toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Dist</p>
                      <p className="telemetry font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.plannedDistanceKm} km</p>
                    </div>
                  </div>
                  {isDriverOrManager && (
                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={() => handleDispatch(t.id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded py-1.5 text-[10px] font-semibold text-[#0D1117] hover:opacity-90"
                        style={{ background: 'var(--color-signal-amber)' }}
                      >
                        <Play size={10} />
                        <span>Dispatch</span>
                      </button>
                      <button
                        onClick={() => handleCancel(t.id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded border py-1.5 text-[10px] font-semibold hover:opacity-90"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-signal-red)' }}
                      >
                        <XCircle size={10} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Dispatched */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleCardDrop(e, 'DISPATCHED')}
            className="ops-panel p-3 space-y-4 min-h-[500px] col-header--dispatch"
          >
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)', fontFamily: "'Space Grotesk'" }}>
                Dispatched <span className="telemetry text-xs" style={{ color: 'var(--color-text-muted)' }}>({dispatchedTrips.length})</span>
              </span>
              <span className="status-badge status-badge--amber">On Trip</span>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {dispatchedTrips.map((t) => (
                <div 
                  key={t.id} 
                  draggable={isDriverOrManager}
                  onDragStart={(e) => handleDragStart(e, t)}
                  className="ops-panel p-4 space-y-3 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="telemetry text-[10px] truncate max-w-[100px]" style={{ color: 'var(--color-text-muted)' }}>ID: {t.id.substring(0, 8)}</span>
                    <span className="status-badge status-badge--amber">On Route</span>
                  </div>
                  <div>
                    <p className="telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Route</p>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      <MapPin size={12} style={{ color: 'var(--color-signal-amber)', flexShrink: 0 }} />
                      <span className="truncate">{t.source}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>&rarr;</span>
                      <span className="truncate">{t.destination}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] p-2 rounded" style={{ background: 'var(--color-surface-raised)' }}>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Vehicle</p>
                      <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{t.vehicle.name}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Driver</p>
                      <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{t.driver.name}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Cargo</p>
                      <p className="telemetry font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.cargoWeightKg.toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Dist</p>
                      <p className="telemetry font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.plannedDistanceKm} km</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-1">
                    {isDriverOrManager && (
                      <>
                        <button
                          onClick={() => setSelectedTripForComplete(t)}
                          className="flex flex-1 items-center justify-center gap-1 rounded py-1.5 text-[10px] font-semibold text-[#0D1117] hover:opacity-90"
                          style={{ background: 'var(--color-signal-green)' }}
                        >
                          <CheckCircle2 size={10} />
                          <span>Complete</span>
                        </button>
                        <button
                          onClick={() => handleCancel(t.id)}
                          className="flex flex-1 items-center justify-center gap-1 rounded border py-1.5 text-[10px] font-semibold hover:opacity-90"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-signal-red)' }}
                        >
                          <XCircle size={10} />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openDocsModal(t)}
                      className="flex items-center justify-center rounded border px-2 py-1 text-2xs font-semibold"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                      title="Trip Documents"
                    >
                      <FileText size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleCardDrop(e, 'COMPLETED')}
            className="ops-panel p-3 space-y-4 min-h-[500px] col-header--complete"
          >
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)', fontFamily: "'Space Grotesk'" }}>
                Completed <span className="telemetry text-xs" style={{ color: 'var(--color-text-muted)' }}>({completedTrips.length})</span>
              </span>
              <span className="status-badge status-badge--green">Delivered</span>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {completedTrips.map((t) => (
                <div 
                  key={t.id} 
                  draggable={isDriverOrManager}
                  onDragStart={(e) => handleDragStart(e, t)}
                  className="ops-panel p-4 space-y-3 opacity-85 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="telemetry text-[10px] truncate max-w-[100px]" style={{ color: 'var(--color-text-muted)' }}>ID: {t.id.substring(0, 8)}</span>
                    <span className="status-badge status-badge--green">Delivered</span>
                  </div>
                  <div>
                    <p className="telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Route</p>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      <MapPin size={12} style={{ color: 'var(--color-signal-amber)', flexShrink: 0 }} />
                      <span className="truncate">{t.source}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>&rarr;</span>
                      <span className="truncate">{t.destination}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] p-2 rounded" style={{ background: 'var(--color-surface-raised)' }}>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Actual Dist</p>
                      <p className="telemetry font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.actualDistanceKm} km</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Fuel Cons</p>
                      <p className="telemetry font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.fuelConsumedL} L</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Vehicle</p>
                      <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{t.vehicle.name}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Driver</p>
                      <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{t.driver.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-3xs pt-1" style={{ color: 'var(--color-text-muted)' }}>
                    <button
                      onClick={() => openDocsModal(t)}
                      className="flex items-center space-x-1 rounded border px-2 py-1 font-semibold"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}
                    >
                      <FileText size={10} />
                      <span>Documents</span>
                    </button>
                    <span>Ended: {new Date(t.completedAt!).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 4: Cancelled */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleCardDrop(e, 'CANCELLED')}
            className="ops-panel p-3 space-y-4 min-h-[500px] col-header--cancelled"
          >
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-primary)', fontFamily: "'Space Grotesk'" }}>
                Cancelled <span className="telemetry text-xs" style={{ color: 'var(--color-text-muted)' }}>({cancelledTrips.length})</span>
              </span>
              <span className="status-badge status-badge--red">Aborted</span>
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {cancelledTrips.map((t) => (
                <div 
                  key={t.id} 
                  draggable={isDriverOrManager}
                  onDragStart={(e) => handleDragStart(e, t)}
                  className="ops-panel p-4 space-y-3 opacity-70 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="telemetry text-[10px] truncate max-w-[100px]" style={{ color: 'var(--color-text-muted)' }}>ID: {t.id.substring(0, 8)}</span>
                    <span className="status-badge status-badge--red">Aborted</span>
                  </div>
                  <div>
                    <p className="telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Route</p>
                    <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      <MapPin size={12} style={{ color: 'var(--color-signal-amber)', flexShrink: 0 }} />
                      <span className="truncate">{t.source}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>&rarr;</span>
                      <span className="truncate">{t.destination}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] p-2 rounded" style={{ background: 'var(--color-surface-raised)' }}>
                    <div className="col-span-2">
                      <p style={{ color: 'var(--color-text-muted)' }}>Assigned Asset</p>
                      <p className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{t.vehicle.name} / {t.driver.name}</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Planned Dist</p>
                      <p className="telemetry font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.plannedDistanceKm} km</p>
                    </div>
                    <div>
                      <p style={{ color: 'var(--color-text-muted)' }}>Cargo</p>
                      <p className="telemetry font-medium" style={{ color: 'var(--color-text-primary)' }}>{t.cargoWeightKg.toLocaleString()} kg</p>
                    </div>
                  </div>
                  <div className="text-3xs mt-1 text-right" style={{ color: 'var(--color-text-muted)' }}>
                    Aborted: {new Date(t.cancelledAt!).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Completion Details Input Modal */}
      {selectedTripForComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md ops-panel p-6">

            <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 className="font-display font-semibold text-scale-md" style={{ color: 'var(--color-text-primary)' }}>Complete Delivery Run</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Route: {selectedTripForComplete.source} &rarr; {selectedTripForComplete.destination}
                </p>
              </div>
              <button onClick={() => setSelectedTripForComplete(null)} style={{ color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {completionError && (
              <div className="mb-4 rounded p-3 text-xs font-semibold" style={{ background: 'rgba(255, 92, 92, 0.1)', color: 'var(--color-signal-red)', border: '1px solid rgba(255, 92, 92, 0.2)' }}>
                {completionError}
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Actual Distance Traveled (km) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--color-text-muted)' }}>
                    <Route size={16} />
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={`Planned: ${selectedTripForComplete.plannedDistanceKm} km`}
                    value={actualDistance}
                    onChange={(e) => setActualDistance(e.target.value)}
                    className="w-full rounded-md border py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                    style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Total Fuel Consumed (liters) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--color-text-muted)' }}>
                    <Gauge size={16} />
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g. 140"
                    value={fuelConsumed}
                    onChange={(e) => setFuelConsumed(e.target.value)}
                    className="w-full rounded-md border py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                    style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <button type="submit" className="w-full btn-primary">
                Log Delivery Outcome
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Trip Documents Management Modal */}
      {selectedTripForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg ops-panel p-6">

            <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 className="font-display font-semibold text-scale-md" style={{ color: 'var(--color-text-primary)' }}>Trip Documents & Manifests</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Route: {selectedTripForDocs.source} &rarr; {selectedTripForDocs.destination}
                </p>
              </div>
              <button onClick={() => setSelectedTripForDocs(null)} style={{ color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {docUploadError && (
              <div className="mb-4 rounded p-2.5 text-xs font-semibold" style={{ background: 'rgba(255, 92, 92, 0.1)', color: 'var(--color-signal-red)', border: '1px solid rgba(255, 92, 92, 0.2)' }}>
                {docUploadError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Document upload form */}
              <div className="pr-0 md:pr-6 space-y-3" style={{ borderRight: '1px solid var(--color-border)' }}>
                <h4 className="telemetry text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Attach Document</h4>

                <form onSubmit={handleDocUpload} className="space-y-3">
                  <div>
                    <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bill of Lading, Delivery Receipt"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      className="w-full rounded-md border px-2 py-1.5 text-xs focus:outline-none"
                      style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    />
                  </div>

                  <div>
                    <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Document Type *</label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full rounded-md border px-2 py-1.5 text-xs focus:outline-none"
                      style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    >
                      <option value="BOL">Bill of Lading (BOL)</option>
                      <option value="POD">Proof of Delivery (POD)</option>
                      <option value="Invoice">Fuel/toll Invoice</option>
                      <option value="Permit">Transit Permit</option>
                      <option value="Other">Other Document</option>
                    </select>
                  </div>

                  <div>
                    <label className="block telemetry text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>Select File *</label>
                    <input
                      type="file"
                      required
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      className="w-full text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    />
                  </div>

                  <button type="submit" disabled={uploadingDoc} className="w-full btn-primary" style={uploadingDoc ? { opacity: 0.5 } : undefined}>
                    <Upload size={12} />
                    <span>{uploadingDoc ? 'Uploading...' : 'Upload File'}</span>
                  </button>
                </form>
              </div>

              {/* Documents list */}
              <div className="space-y-3">
                <h4 className="telemetry text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Uploaded Files</h4>

                {docsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-solid border-r-transparent" style={{ borderColor: 'var(--color-signal-amber)' }} />
                  </div>
                ) : tripDocs.length === 0 ? (
                  <p className="text-xs text-center py-12" style={{ color: 'var(--color-text-muted)' }}>No files uploaded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {tripDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 rounded text-xs" style={{ background: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}>
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }} title={doc.title}>
                            {doc.title}
                          </p>
                          <span className="inline-block text-[8px] font-mono font-bold px-1 py-0.5 rounded" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}>
                            {doc.docType}
                          </span>
                        </div>
                        <a href={doc.s3Url} target="_blank" rel="noreferrer" className="text-xs font-bold hover:underline shrink-0" style={{ color: 'var(--color-signal-amber)' }}>
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
