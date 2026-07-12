'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { SkeletonGrid } from '../components/Skeleton';
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

  const isEligibleRole = user?.role === 'FLEET_MANAGER' || user?.role === 'SAFETY_OFFICER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6 animate-slideUp">
      
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Maintenance Workflow</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Orchestrate workshop queues, track service logs, and manage vehicle downtime.</p>
        </div>
        {isEligibleRole && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Open Maintenance Log</span>
          </button>
        )}
      </div>

      {/* Form Panel */}
      {showAddForm && isEligibleRole && (
        <div className="ops-panel p-5 animate-fadeIn">
          <div className="mb-4 flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Open Shop Maintenance Log</h3>
            <button onClick={() => setShowAddForm(false)} className="hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-[var(--color-signal-red)] border border-[rgba(255,92,92,0.3)]/50">
              {formError}
            </div>
          )}

          <form onSubmit={handleOpenMaintenance} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Select Vehicle *</label>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
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
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Service Cost Estimate (₹)</label>
              <input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Description / Issue reported *</label>
              <textarea
                required
                placeholder="e.g. Brake pad wear replacement, scheduled engine oil flush..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm"
              >
                Initiate Log & Send to Shop
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Logs List */}
      {loading ? (
        <SkeletonGrid count={4} />
      ) : logs.length === 0 ? (
        <div className="ops-panel p-8 text-center">
          <Wrench className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <h3 className="text-md font-bold" style={{ color: 'var(--color-text-muted)' }}>No maintenance records logged</h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>Log workshop work orders here to monitor vehicle repairs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {logs.map((log) => {
            const isActive = log.status === 'ACTIVE';
            return (
              <div key={log.id} className="rounded-lg border p-5 space-y-4 transition-all" style={{ background: 'var(--color-surface)', borderColor: isActive ? 'var(--color-signal-amber)' : 'var(--color-border)' }}>
                
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-lg p-2.5 ${isActive ? 'bg-[rgba(255,176,32,0.12)] text-[var(--color-signal-amber)]' : 'bg-[var(--color-surface-raised)] text-[var(--color-text-muted)]'}`}>
                      <Wrench size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{log.vehicle.name}</h4>
                      <span className="font-mono text-2xs bg-[var(--color-surface-raised)] px-1 py-0.5 rounded telemetry" style={{ color: 'var(--color-text-muted)' }}>{log.vehicle.registrationNumber}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-2xs font-semibold ${isActive ? 'bg-amber-50 text-amber-700 border-amber-200/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200/40'}`}>
                    {log.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-[var(--color-text-muted)]">{log.description}</p>

                {/* Cost & Timestamps */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 dark:border-dark-border text-2xs font-medium text-[var(--color-text-muted)]">
                  <div>
                    <span className="block uppercase font-bold tracking-wider">Service Cost</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>₹{log.cost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block uppercase font-bold tracking-wider">Date Opened</span>
                    <span className="text-xs flex items-center mt-1" style={{ color: 'var(--color-text-primary)' }}>
                      <Calendar size={12} className="mr-1 shrink-0" />
                      {new Date(log.openedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="block uppercase font-bold tracking-wider">Date Closed</span>
                    <span className="text-xs flex items-center mt-1" style={{ color: 'var(--color-text-primary)' }}>
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
                      className="btn-primary w-full justify-center py-2.5 text-xs"
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
