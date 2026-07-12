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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-800 to-amber-600 p-6 text-white shadow-lg">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Safety & Compliance Terminal: {user.name}</h2>
          <p className="mt-1 text-sm text-amber-100 font-mono">Tenant ID: {user.companyId}</p>
          <p className="mt-2 text-xs text-amber-200">
            Monitor driver eligibility, track upcoming license expirations, and audit driver safety performance.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/20 blur-2xl" />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/30 dark:bg-red-950/10">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Error loading compliance data</h3>
          <p className="mt-1 text-sm text-red-600 dark:text-red-500">{error}</p>
        </div>
      ) : (
        <>
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            
            {/* Average Safety Score */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-dark-muted uppercase tracking-wider">Avg Safety Score</p>
                  <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
                    {averageSafetyScore}/100
                  </h3>
                </div>
                <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <Award size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 size={14} className="mr-1" />
                <span>Overall fleet compliance stable</span>
              </div>
            </div>

            {/* Expired Licenses */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-dark-muted uppercase tracking-wider">Expired Licenses</p>
                  <h3 className={`text-3xl font-extrabold mt-2 ${expiredLicenses.length > 0 ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                    {expiredLicenses.length}
                  </h3>
                </div>
                <div className="rounded-lg bg-red-50 p-2.5 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-dark-muted font-semibold">
                <span>Suspended status active</span>
              </div>
            </div>

            {/* Expiring Soon (30d) */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-dark-muted uppercase tracking-wider">Expiring in 30 Days</p>
                  <h3 className={`text-3xl font-extrabold mt-2 ${expiringSoonLicenses.length > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-white'}`}>
                    {expiringSoonLicenses.length}
                  </h3>
                </div>
                <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                  <Calendar size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-dark-muted font-semibold">
                <span>Renewals warning active</span>
              </div>
            </div>

            {/* Low Safety Drivers */}
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-dark-muted uppercase tracking-wider">Drivers under Audit</p>
                  <h3 className={`text-3xl font-extrabold mt-2 ${lowSafetyDrivers.length > 0 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                    {lowSafetyDrivers.length}
                  </h3>
                </div>
                <div className="rounded-lg bg-rose-50 p-2.5 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                  <TrendingDown size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500 dark:text-dark-muted font-semibold">
                <span>Safety score below 85</span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Main Drivers Directory */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
              <h3 className="text-md font-bold text-slate-800 dark:text-white mb-4">Driver Safety Ledger</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 dark:divide-dark-border text-sm text-left">
                  <thead>
                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Driver Name</th>
                      <th className="pb-3">License Class</th>
                      <th className="pb-3 text-center">Safety Score</th>
                      <th className="pb-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-dark-border">
                    {drivers.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="py-3">
                          <p className="font-semibold text-slate-800 dark:text-white">{d.name}</p>
                          <p className="text-3xs text-slate-400 dark:text-dark-muted font-mono">{d.licenseNumber}</p>
                        </td>
                        <td className="py-3 text-slate-600 dark:text-dark-muted">{d.licenseCategory}</td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${d.safetyScore >= 85 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
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
                            className="text-slate-400 hover:text-brand-600 transition-colors"
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
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
                <h3 className="text-md font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                  <Calendar size={18} className="mr-2 text-amber-500" />
                  Upcoming Expirations
                </h3>

                {expiredLicenses.length === 0 && expiringSoonLicenses.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-dark-muted text-center py-6">
                    All driver licenses are fully compliant and valid.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {/* Expired First */}
                    {expiredLicenses.map(d => (
                      <div key={d.id} className="rounded-lg bg-red-50/50 p-3 border border-red-100/50 dark:bg-red-950/10 dark:border-red-900/10">
                        <p className="text-xs font-bold text-red-700">{d.name}</p>
                        <p className="text-3xs text-red-600 font-semibold mt-1">
                          EXPIRED LICENSE: {new Date(d.licenseExpiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    ))}

                    {/* Expiring Soon */}
                    {expiringSoonLicenses.map(d => (
                      <div key={d.id} className="rounded-lg bg-amber-50/50 p-3 border border-amber-100/50 dark:bg-amber-950/10 dark:border-amber-900/10">
                        <p className="text-xs font-bold text-amber-700">{d.name}</p>
                        <p className="text-3xs text-amber-600 font-semibold mt-1">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-dark-card border border-slate-100 dark:border-dark-border">
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">Update Safety Score</h4>
            <p className="text-xs text-slate-400 dark:text-dark-muted font-mono">{editingDriver.name}</p>

            {saveError && (
              <div className="mb-3 rounded bg-red-50 p-2 text-xs font-semibold text-red-500">
                {saveError}
              </div>
            )}

            <form onSubmit={handleUpdateScore} className="space-y-4 mt-3">
              <div>
                <label className="block text-3xs font-bold text-slate-400 uppercase mb-1">Audit Score (0-100) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-brand-600 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  Save Score
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
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
