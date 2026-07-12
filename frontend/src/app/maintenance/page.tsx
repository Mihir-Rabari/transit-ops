'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Wrench, 
  X, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  registrationNumber: string;
  status: string;
}

interface MaintenanceLog {
  id: string;
  description: string;
  cost: number;
  status: 'ACTIVE' | 'CLOSED';
  openedAt: string;
  closedAt: string | null;
  vehicle: {
    registrationNumber: string;
    name: string;
  };
}

export default function MaintenancePage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('0');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/maintenance');
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch maintenance logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVehiclesForLog = async () => {
    try {
      const data = await apiRequest('/vehicles');
      // Filter out retired vehicles from being selected for new maintenance
      setVehicles(data.filter((v: Vehicle) => v.status !== 'RETIRED'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (showAddForm) {
      fetchVehiclesForLog();
    }
  }, [showAddForm]);

  const handleOpenMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!vehicleId || !description) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      await apiRequest('/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId,
          description,
          cost
        })
      });

      // Reset
      setVehicleId('');
      setDescription('');
      setCost('0');
      setShowAddForm(false);
      fetchLogs();
    } catch (err: any) {
      setFormError(err.message || 'Failed to initiate maintenance log');
    }
  };

  const handleCloseMaintenance = async (logId: string) => {
    if (!confirm('Are you sure you want to close this maintenance log? This will set the vehicle back to AVAILABLE.')) return;
    try {
      await apiRequest(`/maintenance/${logId}/close`, { method: 'PATCH' });
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to close maintenance log');
    }
  };

  const isEligibleRole = user?.role === 'FLEET_MANAGER' || user?.role === 'SAFETY_OFFICER';

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Maintenance Workflow</h2>
          <p className="text-sm text-slate-400 dark:text-dark-muted">Orchestrate workshop queues, track service logs, and manage vehicle downtime.</p>
        </div>
        {isEligibleRole && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Open Maintenance Log</span>
          </button>
        )}
      </div>

      {/* Form Panel */}
      {showAddForm && isEligibleRole && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-md animate-fadeIn">
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
            <h3 className="font-bold text-slate-800 dark:text-white">Open Shop Maintenance Log</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-500 border border-red-200/50">
              {formError}
            </div>
          )}

          <form onSubmit={handleOpenMaintenance} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Vehicle *</label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.registrationNumber}) [Status: {v.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service Cost Estimate ($)</label>
              <input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Issue reported *</label>
              <textarea
                required
                placeholder="e.g. Brake pad wear replacement, scheduled engine oil flush..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full sm:w-auto rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Initiate Log & Send to Shop
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Logs List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-dark-border dark:bg-dark-card">
          <Wrench className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-md font-bold text-slate-700 dark:text-slate-300">No maintenance records logged</h3>
          <p className="mt-1 text-xs text-slate-400 dark:text-dark-muted">Log workshop work orders here to monitor vehicle repairs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {logs.map((log) => {
            const isActive = log.status === 'ACTIVE';
            return (
              <div key={log.id} className={`rounded-xl border p-5 bg-white dark:bg-dark-card shadow-sm space-y-4 hover:shadow-md transition-all ${isActive ? 'border-amber-200 dark:border-amber-900/30' : 'border-slate-200 dark:border-dark-border'}`}>
                
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-lg p-2.5 ${isActive ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-900/40'}`}>
                      <Wrench size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-white">{log.vehicle.name}</h4>
                      <span className="font-mono text-2xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-500">{log.vehicle.registrationNumber}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-2xs font-semibold ${isActive ? 'bg-amber-50 text-amber-700 border-amber-200/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200/40'}`}>
                    {log.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-300">{log.description}</p>

                {/* Cost & Timestamps */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-dark-border text-2xs font-medium text-slate-500 dark:text-dark-muted">
                  <div>
                    <span className="block text-slate-400 uppercase font-bold tracking-wider">Service Cost</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">${log.cost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-slate-400 uppercase font-bold tracking-wider">Date Opened</span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center mt-1">
                      <Calendar size={12} className="mr-1 shrink-0" />
                      {new Date(log.openedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-slate-400 uppercase font-bold tracking-wider">Date Closed</span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center mt-1">
                      <Calendar size={12} className="mr-1 shrink-0" />
                      {log.closedAt ? new Date(log.closedAt).toLocaleDateString() : 'Active'}
                    </span>
                  </div>
                </div>

                {/* Closing Actions */}
                {isActive && isEligibleRole && (
                  <div className="pt-1">
                    <button
                      onClick={() => handleCloseMaintenance(log.id)}
                      className="flex w-full items-center justify-center space-x-1.5 rounded-lg bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 shadow-sm"
                    >
                      <CheckCircle size={14} />
                      <span>Release Vehicle & Mark Ready</span>
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
