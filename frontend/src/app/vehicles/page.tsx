'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Search, 
  ChevronDown, 
  FileText, 
  ShieldAlert, 
  X, 
  FilePlus, 
  DollarSign, 
  Wrench,
  Gauge,
  Truck
} from 'lucide-react';

interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacityKg: number;
  odometer: number;
  acquisitionCost: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
  region: string | null;
  totalOperationalCost: number;
}

interface VehicleDocument {
  id: string;
  title: string;
  docType: string;
  expiryDate: string;
}

export default function VehiclesPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [regNum, setRegNum] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Truck');
  const [capacity, setCapacity] = useState('');
  const [odometer, setOdometer] = useState('0');
  const [acqCost, setAcqCost] = useState('');
  const [region, setRegion] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Search/Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  // Documents Modal State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('Insurance');
  const [docExpiry, setDocExpiry] = useState('');
  const [docFormError, setDocFormError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/vehicles');
      setVehicles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!regNum || !name || !type || !capacity || !acqCost) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      await apiRequest('/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          registrationNumber: regNum,
          name,
          type,
          maxLoadCapacityKg: capacity,
          odometer,
          acquisitionCost: acqCost,
          region: region || null
        })
      });
      
      // Reset form and refetch
      setRegNum('');
      setName('');
      setType('Truck');
      setCapacity('');
      setOdometer('0');
      setAcqCost('');
      setRegion('');
      setShowAddForm(false);
      fetchVehicles();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register vehicle');
    }
  };

  // Document Management Methods
  const openDocumentsModal = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDocuments([]);
    setDocLoading(true);
    setDocFormError(null);
    try {
      const docs = await apiRequest(`/vehicles/${vehicle.id}/documents`);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setDocLoading(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocFormError(null);

    if (!selectedVehicle) return;
    if (!docTitle || !docExpiry) {
      setDocFormError('Please fill in all required fields');
      return;
    }

    try {
      const newDoc = await apiRequest(`/vehicles/${selectedVehicle.id}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          title: docTitle,
          docType,
          expiryDate: docExpiry
        })
      });
      setDocuments([newDoc, ...documents]);
      setDocTitle('');
      setDocExpiry('');
    } catch (err: any) {
      setDocFormError(err.message || 'Failed to upload document details');
    }
  };

  const isFleetManager = user?.role === 'FLEET_MANAGER' || user?.role === 'ADMIN';

  // Filters logic
  const filteredVehicles = vehicles
    .filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
                            v.registrationNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter ? v.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'odometer') return b.odometer - a.odometer;
      if (sortBy === 'cost') return b.acquisitionCost - a.acquisitionCost;
      if (sortBy === 'operational') return b.totalOperationalCost - a.totalOperationalCost;
      return a.name.localeCompare(b.name);
    });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/40';
      case 'ON_TRIP':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/40';
      case 'IN_SHOP':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/40';
      case 'RETIRED':
        return 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-[rgba(255,92,92,0.3)]/40';
      default:
        return 'status-badge status-badge--slate';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Vehicle Registry</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Manage company logistics assets and operational parameters.</p>
        </div>
        {isFleetManager && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {/* Add Form Panel */}
      {showAddForm && isFleetManager && (
        <div className="ops-panel p-5 animate-fadeIn">
          <div className="mb-4 flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Register New Vehicle</h3>
            <button onClick={() => setShowAddForm(false)} className="hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-[var(--color-signal-red)] border border-[rgba(255,92,92,0.3)]/50">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddVehicle} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Registration Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. CA-459-ZZ"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Vehicle Name / Model *</label>
              <input
                type="text"
                required
                placeholder="e.g. Scania R500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Vehicle Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Sedan">Sedan</option>
                <option value="Semi-Trailer">Semi-Trailer</option>
                <option value="Container">Container</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Max Load Capacity (kg) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 15000"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Initial Odometer (km)</label>
              <input
                type="number"
                min="0"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Acquisition Cost ($) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 85000"
                value={acqCost}
                onChange={(e) => setAcqCost(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Operating Region</label>
              <input
                type="text"
                placeholder="e.g. North"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div className="flex items-end sm:col-span-2 md:col-span-2">
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm"
              >
                Register Vehicle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Filter Panel */}
      <div className="ops-panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--color-text-muted)' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by registration number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border py-2 pl-10 pr-4 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-md border px-3 py-1.5 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              <option value="name">Name</option>
              <option value="odometer">Odometer (High-Low)</option>
              <option value="cost">Acquisition Cost (High-Low)</option>
              <option value="operational">Operational Cost (High-Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent" style={{ borderColor: 'var(--color-signal-amber)' }} />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="ops-panel p-8 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <h3 className="text-md font-bold" style={{ color: 'var(--color-text-muted)' }}>No vehicles matching your query</h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>Verify your filters or search constraints.</p>
        </div>
      ) : (
        <div className="overflow-x-auto ops-panel">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(35,43,55,0.4)', color: 'var(--color-text-muted)' }}>
              <tr>
                <th className="px-6 py-4">Vehicle Details</th>
                <th className="px-6 py-4">Max Capacity</th>
                <th className="px-6 py-4">Odometer</th>
                <th className="px-6 py-4 text-right">Costs</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {filteredVehicles.map((v) => (
                <tr key={v.id} className="transition-colors hover:bg-[var(--color-surface-raised)]">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg p-2" style={{ background: 'rgba(255,176,32,0.12)', color: 'var(--color-signal-amber)' }}>
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{v.name}</p>
                        <p className="text-xs flex items-center" style={{ color: 'var(--color-text-muted)' }}>
                          <span className="telemetry bg-[var(--color-surface-raised)] px-1 py-0.5 rounded text-2xs mr-2" style={{ color: 'var(--color-text-muted)' }}>{v.registrationNumber}</span>
                          {v.type} • {v.region || 'No Region'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium" style={{ color: 'var(--color-text-muted)' }}>
                    {v.maxLoadCapacityKg.toLocaleString()} kg
                  </td>
                  <td className="px-6 py-4 telemetry" style={{ color: 'var(--color-text-muted)' }}>
                    {v.odometer.toLocaleString()} km
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>${v.acquisitionCost.toLocaleString()}</p>
                    <p className="text-2xs font-medium" style={{ color: 'var(--color-signal-amber)' }}>Ops: ${v.totalOperationalCost.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(v.status)}`}>
                      {v.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => openDocumentsModal(v)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold hover:opacity-80"
                      style={{ color: 'var(--color-signal-amber)' }}
                    >
                      <FileText size={14} />
                      <span>Documents</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Documents Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg ops-panel p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Documents: {selectedVehicle.name}</h3>
                <p className="text-2xs text-[var(--color-text-muted)] dark:text-dark-muted font-mono">{selectedVehicle.registrationNumber}</p>
              </div>
              <button onClick={() => setSelectedVehicle(null)} className="hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Existing Documents List */}
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>Registered Documents</h4>
              {docLoading ? (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-r-transparent" style={{ borderColor: 'var(--color-signal-amber)' }} />
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-lg p-4 text-center text-xs" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}>
                  No document records registered for this vehicle.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {documents.map((doc) => {
                    const isExpired = new Date(doc.expiryDate) < new Date();
                    return (
                      <div key={doc.id} className="flex justify-between items-center p-3 rounded-lg border" style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border)' }}>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{doc.title}</p>
                          <p className="text-2xs capitalize" style={{ color: 'var(--color-text-muted)' }}>{doc.docType}</p>
                        </div>
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded ${isExpired ? 'status-badge--red' : 'status-badge--amber'}`}>
                          Exp: {new Date(doc.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upload Document Form */}
            {isFleetManager && (
              <div className="border-t border-[var(--color-border)] pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>Add Document Record</h4>
                
                {docFormError && (
                  <div className="mb-3 rounded p-2 text-2xs font-semibold" style={{ background: 'rgba(255,92,92,0.1)', color: 'var(--color-signal-red)' }}>
                    {docFormError}
                  </div>
                )}

                <form onSubmit={handleAddDocument} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-3xs font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}>Document Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Q3 Cargo Permit"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full mt-1 rounded-md border px-2 py-1.5 text-xs focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-3xs font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}>Document Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full mt-1 rounded-md border px-2 py-1.5 text-xs focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                      >
                        <option value="Insurance">Insurance</option>
                        <option value="Permit">Cargo Permit</option>
                        <option value="Registration">Registration</option>
                        <option value="Safety Cert">Safety Certificate</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-3xs font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}>Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={docExpiry}
                      onChange={(e) => setDocExpiry(e.target.value)}
                      className="w-full mt-1 rounded-md border px-2 py-1.5 text-xs focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full justify-center py-2 text-xs"
                  >
                    <FilePlus size={14} />
                    <span>Upload Document Details</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
