'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
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
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Trip Management</h2>
          <p className="text-sm text-slate-400 dark:text-dark-muted">Drag and drop cards to change trip statuses natively.</p>
        </div>
        {isFleetManager && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Create Draft Trip</span>
          </button>
        )}
      </div>

      {/* Create Trip Form Panel */}
      {showAddForm && isFleetManager && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-md animate-fadeIn">
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
            <h3 className="font-bold text-slate-800 dark:text-white">Create Draft Trip</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-500 border border-red-200/50">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateTrip} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source / Origin *</label>
              <input
                type="text"
                required
                placeholder="e.g. Chicago Depot"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Destination *</label>
              <input
                type="text"
                required
                placeholder="e.g. Detroit Fulfillment Center"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Available Vehicle *</label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Available Driver *</label>
              <select
                required
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
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
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo Weight (kg) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 5400"
                value={cargoWeight}
                onChange={(e) => setCargoWeight(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Planned Distance (km) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 460"
                value={plannedDistance}
                onChange={(e) => setPlannedDistance(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-end sm:col-span-2 md:col-span-3">
              <button
                type="submit"
                className="w-full sm:w-auto rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Create Draft Trip
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trips Kanban Board */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent" />
        </div>
      ) : trips.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-dark-border dark:bg-dark-card shadow-sm">
          <Route className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-md font-bold text-slate-700 dark:text-slate-300">No trips logged in the system yet</h3>
          <p className="mt-1 text-xs text-slate-400 dark:text-dark-muted">Register a vehicle and a driver first to create a trip.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Column 1: Drafts */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleCardDrop(e, 'DRAFT')}
            className="space-y-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/10 p-3 min-h-[500px]"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-dark-border">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Draft ({draftTrips.length})</span>
              <span className="h-2 w-2 rounded-full bg-slate-400" />
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {draftTrips.map((t) => (
                <div 
                  key={t.id} 
                  draggable={isDriverOrManager}
                  onDragStart={(e) => handleDragStart(e, t)}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-card space-y-3 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start text-xs font-semibold text-slate-400">
                    <span className="font-mono text-2xs truncate max-w-[100px]">ID: {t.id.substring(0, 8)}</span>
                    <span className="text-slate-500">Draft</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-dark-muted uppercase font-bold tracking-wider">Route</p>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">
                      <MapPin size={12} className="text-brand-500 shrink-0" />
                      <span className="truncate">{t.source}</span>
                      <span className="text-slate-300 font-light">&rarr;</span>
                      <span className="truncate">{t.destination}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-2xs bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg">
                    <div>
                      <p className="text-slate-400">Vehicle</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{t.vehicle.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Driver</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{t.driver.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Cargo</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{t.cargoWeightKg.toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Dist</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{t.plannedDistanceKm} km</p>
                    </div>
                  </div>
                  {isDriverOrManager && (
                    <div className="flex space-x-2 pt-1">
                      <button
                        onClick={() => handleDispatch(t.id)}
                        className="flex flex-1 items-center justify-center space-x-1 rounded bg-brand-600 py-1.5 text-2xs font-semibold text-white hover:bg-brand-700"
                      >
                        <Play size={10} />
                        <span>Dispatch</span>
                      </button>
                      <button
                        onClick={() => handleCancel(t.id)}
                        className="flex flex-1 items-center justify-center space-x-1 rounded border border-slate-200 hover:bg-red-50 hover:text-red-500 dark:border-dark-border dark:hover:bg-red-950/20 text-2xs font-semibold"
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
            className="space-y-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/10 p-3 min-h-[500px]"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-dark-border">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Dispatched ({dispatchedTrips.length})</span>
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {dispatchedTrips.map((t) => (
                <div 
                  key={t.id} 
                  draggable={isDriverOrManager}
                  onDragStart={(e) => handleDragStart(e, t)}
                  className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-card space-y-3 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start text-xs font-semibold text-blue-500">
                    <span className="font-mono text-2xs truncate max-w-[100px] text-slate-400">ID: {t.id.substring(0, 8)}</span>
                    <span>On Route</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-dark-muted uppercase font-bold tracking-wider">Route</p>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">
                      <MapPin size={12} className="text-brand-500 shrink-0" />
                      <span className="truncate">{t.source}</span>
                      <span className="text-slate-300 font-light">&rarr;</span>
                      <span className="truncate">{t.destination}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-2xs bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg">
                    <div>
                      <p className="text-slate-400">Vehicle</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{t.vehicle.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Driver</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{t.driver.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Cargo</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{t.cargoWeightKg.toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Dist</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{t.plannedDistanceKm} km</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-1">
                    {isDriverOrManager && (
                      <>
                        <button
                          onClick={() => setSelectedTripForComplete(t)}
                          className="flex flex-1 items-center justify-center space-x-1 rounded bg-emerald-600 py-1.5 text-2xs font-semibold text-white hover:bg-emerald-700 animate-pulse"
                        >
                          <CheckCircle2 size={10} />
                          <span>Complete</span>
                        </button>
                        <button
                          onClick={() => handleCancel(t.id)}
                          className="flex flex-1 items-center justify-center space-x-1 rounded border border-slate-200 hover:bg-red-50 hover:text-red-500 dark:border-dark-border dark:hover:bg-red-950/20 text-2xs font-semibold"
                        >
                          <XCircle size={10} />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openDocsModal(t)}
                      className="flex items-center justify-center rounded border border-slate-200 px-2 py-1 text-2xs font-semibold text-slate-400 hover:text-brand-500 dark:border-dark-border"
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
            className="space-y-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/10 p-3 min-h-[500px]"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-dark-border">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Completed ({completedTrips.length})</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {completedTrips.map((t) => (
                <div 
                  key={t.id} 
                  draggable={isDriverOrManager}
                  onDragStart={(e) => handleDragStart(e, t)}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-card space-y-3 hover:shadow-md transition-all opacity-85 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start text-xs font-semibold text-emerald-500">
                    <span className="font-mono text-2xs truncate max-w-[100px] text-slate-400">ID: {t.id.substring(0, 8)}</span>
                    <span>Delivered</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-dark-muted uppercase font-bold tracking-wider">Route</p>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">
                      <MapPin size={12} className="text-brand-500 shrink-0" />
                      <span className="truncate">{t.source}</span>
                      <span className="text-slate-300 font-light">&rarr;</span>
                      <span className="truncate">{t.destination}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-2xs bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg">
                    <div>
                      <p className="text-slate-400">Actual Dist</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{t.actualDistanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Fuel Cons</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{t.fuelConsumedL} L</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Vehicle</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{t.vehicle.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Driver</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{t.driver.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-3xs text-slate-400 dark:text-dark-muted pt-1">
                    <button
                      onClick={() => openDocsModal(t)}
                      className="flex items-center space-x-1 rounded bg-slate-50 border border-slate-200/50 px-2 py-1 font-semibold text-slate-500 hover:text-brand-600 dark:bg-slate-800/40 dark:border-dark-border"
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
            className="space-y-4 rounded-xl bg-slate-100/50 dark:bg-slate-900/10 p-3 min-h-[500px]"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-dark-border">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Cancelled ({cancelledTrips.length})</span>
              <span className="h-2 w-2 rounded-full bg-red-400" />
            </div>
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {cancelledTrips.map((t) => (
                <div 
                  key={t.id} 
                  draggable={isDriverOrManager}
                  onDragStart={(e) => handleDragStart(e, t)}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-card space-y-3 hover:shadow-md transition-all opacity-70 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex justify-between items-start text-xs font-semibold text-red-500">
                    <span className="font-mono text-2xs truncate max-w-[100px] text-slate-400">ID: {t.id.substring(0, 8)}</span>
                    <span>Aborted</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-dark-muted uppercase font-bold tracking-wider">Route</p>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-200 font-semibold mt-1">
                      <MapPin size={12} className="text-brand-500 shrink-0" />
                      <span className="truncate">{t.source}</span>
                      <span className="text-slate-300 font-light">&rarr;</span>
                      <span className="truncate">{t.destination}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-2xs bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg">
                    <div className="col-span-2">
                      <p className="text-slate-400">Assigned Asset</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{t.vehicle.name} / {t.driver.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Planned Dist</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{t.plannedDistanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Cargo</p>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{t.cargoWeightKg.toLocaleString()} kg</p>
                    </div>
                  </div>
                  <div className="text-3xs text-slate-400 mt-1 dark:text-dark-muted text-right">
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-card border border-slate-100 dark:border-dark-border">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Complete Delivery Run</h3>
                <p className="text-xs text-slate-400 dark:text-dark-muted">
                  Route: {selectedTripForComplete.source} &rarr; {selectedTripForComplete.destination}
                </p>
              </div>
              <button onClick={() => setSelectedTripForComplete(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {completionError && (
              <div className="mb-4 rounded bg-red-50 p-3 text-xs font-semibold text-red-500">
                {completionError}
              </div>
            )}

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Actual Distance Traveled (km) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Route size={16} />
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={`Planned: ${selectedTripForComplete.plannedDistanceKm} km`}
                    value={actualDistance}
                    onChange={(e) => setActualDistance(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-brand-500 dark:border-dark-border dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Total Fuel Consumed (liters) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
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
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-brand-500 dark:border-dark-border dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 shadow-md transition-all"
              >
                Log Delivery Outcome
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Trip Documents Management Modal */}
      {selectedTripForDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-card border border-slate-100 dark:border-dark-border">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Trip Documents & Manifests</h3>
                <p className="text-xs text-slate-400 dark:text-dark-muted">
                  Route: {selectedTripForDocs.source} &rarr; {selectedTripForDocs.destination}
                </p>
              </div>
              <button onClick={() => setSelectedTripForDocs(null)} className="text-slate-400 hover:text-slate-600">
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
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attach Document</h4>
                
                <form onSubmit={handleDocUpload} className="space-y-3">
                  <div>
                    <label className="block text-3xs font-bold text-slate-400 uppercase mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bill of Lading, Delivery Receipt"
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
                      <option value="BOL">Bill of Lading (BOL)</option>
                      <option value="POD">Proof of Delivery (POD)</option>
                      <option value="Invoice">Fuel/toll Invoice</option>
                      <option value="Permit">Transit Permit</option>
                      <option value="Other">Other Document</option>
                    </select>
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
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Uploaded Files</h4>

                {docsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-r-transparent" />
                  </div>
                ) : tripDocs.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-dark-muted text-center py-12">No files uploaded yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {tripDocs.map((doc) => (
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
