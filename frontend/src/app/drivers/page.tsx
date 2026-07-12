'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Plus, 
  Search, 
  ShieldAlert, 
  X, 
  UserPlus, 
  Calendar,
  Phone,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
}

export default function DriversPage() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [licenseNum, setLicenseNum] = useState('');
  const [licenseCat, setLicenseCat] = useState('');
  const [licenseExp, setLicenseExp] = useState('');
  const [contactNum, setContactNum] = useState('');
  const [safetyScore, setSafetyScore] = useState('100');
  const [formError, setFormError] = useState<string | null>(null);

  // Search/Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/drivers');
      setDrivers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !licenseNum || !licenseCat || !licenseExp || !contactNum) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      await apiRequest('/drivers', {
        method: 'POST',
        body: JSON.stringify({
          name,
          licenseNumber: licenseNum,
          licenseCategory: licenseCat,
          licenseExpiryDate: licenseExp,
          contactNumber: contactNum,
          safetyScore
        })
      });

      // Reset form and refetch
      setName('');
      setLicenseNum('');
      setLicenseCat('');
      setLicenseExp('');
      setContactNum('');
      setSafetyScore('100');
      setShowAddForm(false);
      fetchDrivers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add driver');
    }
  };

  const isFleetManager = user?.role === 'FLEET_MANAGER';

  // Expiry calculation helper: check if license expires in < 30 days
  const getLicenseExpiryInfo = (expiryDateStr: string) => {
    const today = new Date();
    const expiryDate = new Date(expiryDateStr);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { expired: true, warning: true, text: 'Expired', class: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200/50' };
    }
    if (diffDays <= 30) {
      return { expired: false, warning: true, text: `${diffDays} days left`, class: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50 animate-pulse' };
    }
    return { expired: false, warning: false, text: 'Valid', class: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50' };
  };

  // Filter & Sort logic
  const filteredDrivers = drivers
    .filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
                            d.licenseNumber.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter ? d.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.safetyScore - a.safetyScore;
      return a.name.localeCompare(b.name);
    });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/40';
      case 'ON_TRIP':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/40';
      case 'OFF_DUTY':
        return 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 border-slate-200/40';
      case 'SUSPENDED':
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
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Driver Registry</h2>
          <p className="text-sm text-slate-400 dark:text-dark-muted">Manage active drivers, track driver compliance, licenses, and safety metrics.</p>
        </div>
        {isFleetManager && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-md transition-all self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Driver</span>
          </button>
        )}
      </div>

      {/* Add Form Panel */}
      {showAddForm && isFleetManager && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-md animate-fadeIn">
          <div className="mb-4 flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
            <h3 className="font-bold text-slate-800 dark:text-white">Register New Driver Profile</h3>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-500 border border-red-200/50">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddDriver} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Driver Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Mercer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">License Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. DL-9838183-A"
                value={licenseNum}
                onChange={(e) => setLicenseNum(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">License Category *</label>
              <input
                type="text"
                required
                placeholder="e.g. Class A Commercial"
                value={licenseCat}
                onChange={(e) => setLicenseCat(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">License Expiry Date *</label>
              <input
                type="date"
                required
                value={licenseExp}
                onChange={(e) => setLicenseExp(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. +1 555 982 1283"
                value={contactNum}
                onChange={(e) => setContactNum(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Initial Safety Score (0-100)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={safetyScore}
                onChange={(e) => setSafetyScore(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-end sm:col-span-2 md:col-span-3">
              <button
                type="submit"
                className="w-full sm:w-auto rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Add Driver Profile
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
            placeholder="Search drivers by name or license number..."
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
              <option value="OFF_DUTY">Off Duty</option>
              <option value="SUSPENDED">Suspended</option>
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
              <option value="score">Safety Score (High-Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand-500 border-r-transparent" />
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-dark-border dark:bg-dark-card">
          <ShieldAlert className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-md font-bold text-slate-700 dark:text-slate-300">No drivers matching your query</h3>
          <p className="mt-1 text-xs text-slate-400 dark:text-dark-muted">Verify your filters or search constraints.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-dark-border dark:bg-dark-card shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-dark-border text-left text-sm">
            <thead className="bg-slate-50/70 dark:bg-slate-900/40 text-xs font-semibold text-slate-400 dark:text-dark-muted uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Driver Profile</th>
                <th className="px-6 py-4">License Credentials</th>
                <th className="px-6 py-4">License Expiry Status</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Safety Score</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {filteredDrivers.map((d) => {
                const expiryInfo = getLicenseExpiryInfo(d.licenseExpiryDate);
                return (
                  <tr key={d.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-850 font-semibold text-slate-600 dark:text-slate-300">
                          {d.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{d.name}</p>
                          <p className="text-xs text-slate-400 dark:text-dark-muted">Driver Profile</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{d.licenseNumber}</p>
                      <p className="text-2xs text-slate-400 dark:text-dark-muted">{d.licenseCategory}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center">
                          <Calendar size={12} className="mr-1 text-slate-400" />
                          {new Date(d.licenseExpiryDate).toLocaleDateString()}
                        </span>
                        <span className={`inline-flex self-start rounded border px-1.5 py-0.5 text-3xs font-bold uppercase ${expiryInfo.class}`}>
                          {expiryInfo.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-dark-muted font-medium flex items-center mt-3">
                      <Phone size={12} className="mr-1.5 text-slate-400" />
                      {d.contactNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-bold text-sm ${d.safetyScore >= 85 ? 'text-emerald-500' : d.safetyScore >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                          {d.safetyScore}
                        </span>
                        <span className="text-2xs text-slate-400">/100</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeClass(d.status)}`}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
