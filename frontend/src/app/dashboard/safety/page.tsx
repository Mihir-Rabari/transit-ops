'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Users, 
  Calendar, 
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Edit2
} from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  safetyScore: number;
  status: string;
  contactNumber: string;
}

export default function SafetyDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Safety Score state
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [newScore, setNewScore] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Protect client side
  useEffect(() => {
    if (user && user.role !== 'SAFETY_OFFICER' && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/drivers');
      setDrivers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch safety compliance records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && (user.role === 'SAFETY_OFFICER' || user.role === 'ADMIN')) {
      fetchDrivers();
    }
  }, [user, fetchDrivers]);

  const handleUpdateScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!editingDriver || !newScore) return;
    const scoreVal = parseFloat(newScore);

    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
      setSaveError('Safety score must be a number between 0 and 100');
      return;
    }

    try {
      await apiRequest(`/drivers/${editingDriver.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ safetyScore: scoreVal })
      });
      setEditingDriver(null);
      setNewScore('');
      fetchDrivers();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update safety score');
    }
  };

  if (user?.role !== 'SAFETY_OFFICER' && user?.role !== 'ADMIN') {
    return null;
  }

  // Compliance calculations
  const today = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(today.getDate() + 30);

  const expiredLicenses = drivers.filter(d => new Date(d.licenseExpiryDate) < today);
  const expiringSoonLicenses = drivers.filter(d => {
    const expiry = new Date(d.licenseExpiryDate);
    return expiry >= today && expiry <= thirtyDaysLater;
  });

  const lowSafetyDrivers = drivers.filter(d => d.safetyScore < 85);
  const averageSafetyScore = drivers.length > 0 
    ? Math.round(drivers.reduce((sum, d) => sum + d.safetyScore, 0) / drivers.length)
    : 100;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="ops-panel p-5">
        <h2 className="text-2xl font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
          Safety & Compliance Terminal: {user.name}
        </h2>
        <p className="mt-1 text-sm telemetry" style={{ color: 'var(--color-text-muted)' }}>
          Tenant ID: {user.companyId}
        </p>
        <p className="mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Monitor driver eligibility, track upcoming license expirations, and audit driver safety performance.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <span className="text-sm telemetry" style={{ color: 'var(--color-text-muted)' }}>
            Loading compliance data...
          </span>
        </div>
      ) : error ? (
        <div className="ops-panel p-6 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-signal-red)' }} />
          <h3 className="text-lg font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
            Error loading compliance data
          </h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Average Safety Score */}
            <div className="kpi-tile">
              <Award size={20} style={{ color: 'var(--color-text-muted)' }} />
              <div className="kpi-tile__label">Avg Safety Score</div>
              <div className="kpi-tile__value">
                {averageSafetyScore}/100
              </div>
              <div className="mt-4 flex items-center text-xs" style={{ color: 'var(--color-signal-green)' }}>
                <CheckCircle2 size={14} className="mr-1" />
                <span>Overall fleet compliance stable</span>
              </div>
            </div>

            {/* Expired Licenses */}
            <div className="kpi-tile">
              <AlertTriangle size={20} style={{ color: 'var(--color-text-muted)' }} />
              <div className="kpi-tile__label">Expired Licenses</div>
              <div className="kpi-tile__value" style={expiredLicenses.length > 0 ? { color: 'var(--color-signal-red)' } : undefined}>
                {expiredLicenses.length}
              </div>
              <div className="mt-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Suspended status active
              </div>
            </div>

            {/* Expiring Soon (30d) */}
            <div className="kpi-tile">
              <Calendar size={20} style={{ color: 'var(--color-text-muted)' }} />
              <div className="kpi-tile__label">Expiring in 30 Days</div>
              <div className="kpi-tile__value" style={expiringSoonLicenses.length > 0 ? { color: 'var(--color-signal-amber)' } : undefined}>
                {expiringSoonLicenses.length}
              </div>
              <div className="mt-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Renewals warning active
              </div>
            </div>

            {/* Low Safety Drivers */}
            <div className="kpi-tile">
              <TrendingDown size={20} style={{ color: 'var(--color-text-muted)' }} />
              <div className="kpi-tile__label">Drivers under Audit</div>
              <div className="kpi-tile__value" style={lowSafetyDrivers.length > 0 ? { color: 'var(--color-signal-red)' } : undefined}>
                {lowSafetyDrivers.length}
              </div>
              <div className="mt-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Safety score below 85
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Main Drivers Directory */}
            <div className="lg:col-span-2 ops-panel p-5">
              <h3 className="text-md font-bold font-display mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Driver Safety Ledger
              </h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3" style={{ color: 'var(--color-text-muted)' }}>Driver Name</th>
                      <th className="pb-3" style={{ color: 'var(--color-text-muted)' }}>License Class</th>
                      <th className="pb-3 text-center" style={{ color: 'var(--color-text-muted)' }}>Safety Score</th>
                      <th className="pb-3 text-center" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ color: 'var(--color-border)' }}>
                    {drivers.map(d => (
                      <tr key={d.id}>
                        <td className="py-3">
                          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{d.name}</p>
                          <p className="telemetry text-xs" style={{ color: 'var(--color-text-muted)' }}>{d.licenseNumber}</p>
                        </td>
                        <td className="py-3" style={{ color: 'var(--color-text-muted)' }}>{d.licenseCategory}</td>
                        <td className="py-3 text-center">
                          <span className={`status-badge ${d.safetyScore >= 85 ? 'status-badge--green' : 'status-badge--red'}`}>
                            {d.safetyScore}/100
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => {
                              setEditingDriver(d);
                              setNewScore(d.safetyScore.toString());
                              setSaveError(null);
                            }}
                            style={{ color: 'var(--color-text-muted)' }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <Edit2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sidebar Expiry / Warnings */}
            <div className="space-y-6">
              
              {/* Expiring Licenses Box */}
              <div className="ops-panel p-5">
                <h3 className="text-md font-bold font-display mb-4 flex items-center" style={{ color: 'var(--color-text-primary)' }}>
                  <Calendar size={18} className="mr-2" style={{ color: 'var(--color-signal-amber)' }} />
                  Upcoming Expirations
                </h3>

                {expiredLicenses.length === 0 && expiringSoonLicenses.length === 0 ? (
                  <p className="text-xs text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
                    All driver licenses are fully compliant and valid.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Expired First */}
                    {expiredLicenses.map(d => (
                      <div key={d.id} className="ops-panel p-3">
                        <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{d.name}</p>
                        <p className="text-xs mt-1 telemetry" style={{ color: 'var(--color-signal-red)' }}>
                          EXPIRED LICENSE: {new Date(d.licenseExpiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}

                    {/* Expiring Soon */}
                    {expiringSoonLicenses.map(d => (
                      <div key={d.id} className="ops-panel p-3">
                        <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{d.name}</p>
                        <p className="text-xs mt-1 telemetry" style={{ color: 'var(--color-signal-amber)' }}>
                          Expires soon: {new Date(d.licenseExpiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </>
      )}

      {/* Edit Safety Score Modal */}
      {editingDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm ops-panel p-5">
            <h4 className="font-bold font-display mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Update Safety Score
            </h4>
            <p className="text-xs telemetry" style={{ color: 'var(--color-text-muted)' }}>
              {editingDriver.name}
            </p>

            {saveError && (
              <div className="mb-3 p-2 text-xs font-semibold" style={{ color: 'var(--color-signal-red)' }}>
                {saveError}
              </div>
            )}

            <form onSubmit={handleUpdateScore} className="space-y-4 mt-3">
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Audit Score (0-100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ 
                    backgroundColor: 'var(--color-surface-raised)', 
                    color: 'var(--color-text-primary)', 
                    border: '1px solid var(--color-border)', 
                    borderRadius: '6px',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2.5 text-xs"
                >
                  Save Score
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="flex-1 py-2.5 text-xs font-semibold"
                  style={{ 
                    border: '1px solid var(--color-border)', 
                    color: 'var(--color-text-muted)', 
                    borderRadius: '6px' 
                  }}
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
