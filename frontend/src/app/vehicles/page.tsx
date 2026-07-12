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

  const isFleetManager = user?.role === 'FLEET_MANAGER';

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
        return 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200/40';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Vehicle Registry</h2>
          <p className="text-sm text-slate-400 dark:text-dark-muted">Manage company logistics assets and operational parameters.</p>
        </div>
        {isFleetManager && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        )}
      </div>

      {/* Add Form Panel */}
      {showAddForm && isFleetManager && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-md animate-fadeIn">
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
            <h3 className="font-bold text-slate-800 dark:text-white">Register New Vehicle</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-500 border border-red-200/50">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddVehicle} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Registration Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. CA-459-ZZ"
                value={regNum}
                onChange={(e) => setRegNum(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehicle Name / Model *</label>
              <input
                type="text"
                required
                placeholder="e.g. Scania R500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vehicle Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              >
                <option value="Truck">Truck</option>
                <option value="Van">Van</option>
                <option value="Sedan">Sedan</option>
                <option value="Semi-Trailer">Semi-Trailer</option>
                <option value="Container">Container</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Max Load Capacity (kg) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 15000"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Odometer (km)</label>
              <input
                type="number"
                min="0"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Acquisition Cost ($) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 85000"
                value={acqCost}
                onChange={(e) => setAcqCost(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Operating Region</label>
              <input
                type="text"
                placeholder="e.g. North"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-end sm:col-span-2 md:col-span-2">
              <button
                type="submit"
                className="w-full sm:w-auto rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Register Vehicle
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
            placeholder="Search by registration number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent" />
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-dark-border dark:bg-dark-card">
          <ShieldAlert className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-md font-bold text-slate-700 dark:text-slate-300">No vehicles matching your query</h3>
          <p className="mt-1 text-xs text-slate-400 dark:text-dark-muted">Verify your filters or search constraints.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-dark-border dark:bg-dark-card shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-dark-border text-left text-sm">
            <thead className="bg-slate-50/70 dark:bg-slate-900/40 text-xs font-semibold text-slate-400 dark:text-dark-muted uppercase tracking-wider">
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
                <tr key={v.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400">
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">{v.name}</p>
                        <p className="text-xs text-slate-400 dark:text-dark-muted flex items-center">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-2xs mr-2">{v.registrationNumber}</span>
                          {v.type} • {v.region || 'No Region'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-300">
                    {v.maxLoadCapacityKg.toLocaleString()} kg
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-500 dark:text-dark-muted">
                    {v.odometer.toLocaleString()} km
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">${v.acquisitionCost.toLocaleString()}</p>
                    <p className="text-2xs text-brand-600 dark:text-brand-400 font-medium">Ops: ${v.totalOperationalCost.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(v.status)}`}>
                      {v.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => openDocumentsModal(v)}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
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
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-dark-card border border-slate-100 dark:border-dark-border max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white">Documents: {selectedVehicle.name}</h3>
                <p className="text-2xs text-slate-400 dark:text-dark-muted font-mono">{selectedVehicle.registrationNumber}</p>
              </div>
              <button onClick={() => setSelectedVehicle(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Existing Documents List */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Documents</h4>
              {docLoading ? (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-r-transparent" />
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-lg bg-slate-50 p-4 text-center dark:bg-slate-900/20 text-xs text-slate-400">
                  No document records registered for this vehicle.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {documents.map((doc) => {
                    const isExpired = new Date(doc.expiryDate) < new Date();
                    return (
                      <div key={doc.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-100 dark:border-dark-border">
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{doc.title}</p>
                          <p className="text-2xs text-slate-400 dark:text-dark-muted capitalize">{doc.docType}</p>
                        </div>
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded ${isExpired ? 'bg-red-50 text-red-600 dark:bg-red-950/20' : 'bg-brand-50 text-brand-600 dark:bg-brand-950/20'}`}>
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
              <div className="border-t border-slate-100 pt-4 dark:border-dark-border">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Document Record</h4>
                
                {docFormError && (
                  <div className="mb-3 rounded bg-red-50 p-2 text-2xs font-semibold text-red-500">
                    {docFormError}
                  </div>
                )}

                <form onSubmit={handleAddDocument} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-3xs font-bold text-slate-400 uppercase">Document Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Q3 Cargo Permit"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full mt-1 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500 dark:border-dark-border dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-3xs font-bold text-slate-400 uppercase">Document Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value)}
                        className="w-full mt-1 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500 dark:border-dark-border dark:bg-slate-900 dark:text-white"
                      >
                        <option value="Insurance">Insurance</option>
                        <option value="Permit">Cargo Permit</option>
                        <option value="Registration">Registration</option>
                        <option value="Safety Cert">Safety Certificate</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-3xs font-bold text-slate-400 uppercase">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={docExpiry}
                      onChange={(e) => setDocExpiry(e.target.value)}
                      className="w-full mt-1 rounded border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-brand-500 dark:border-dark-border dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white hover:bg-brand-700"
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
