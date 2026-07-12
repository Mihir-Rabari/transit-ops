'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../../utils/api';
import { 
  Truck, 
  Users, 
  Route, 
  Wrench, 
  Percent, 
  Filter, 
  AlertTriangle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';

interface KPIs {
  totalVehicles: number;
  activeVehicles: number;
  availableVehicles: number;
  maintenanceVehicles: number;
  retiredVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  availableDrivers: number;
  activeTrips: number;
  pendingTrips: number;
  utilization: number;
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // Dropdown options
  const regions = ['North', 'South', 'East', 'West', 'Central', 'Metropolitan'];
  const types = ['Truck', 'Van', 'Sedan', 'Semi-Trailer', 'Container'];
  const statuses = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

  // Protect client side
  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'FLEET_MANAGER') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const fetchKPIs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (regionFilter) params.append('region', regionFilter);

      const data = await apiRequest(`/dashboard/kpis?${params.toString()}`);
      setKpis(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch KPIs');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, regionFilter]);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'FLEET_MANAGER')) {
      fetchKPIs();
    }
  }, [user, fetchKPIs]);

  const clearFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setRegionFilter('');
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'FLEET_MANAGER') {
    return null;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/30 dark:bg-red-950/10">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h3 className="text-lg font-bold text-red-800 dark:text-red-400">Error loading dashboard</h3>
        <p className="mt-1 text-sm text-red-600 dark:text-red-500">{error}</p>
        <button
          onClick={fetchKPIs}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-800 to-brand-600 p-6 text-white shadow-lg">
        <div className="relative z-10 max-w-lg">
          <h2 className="text-2xl font-bold">Welcome back, {user?.name}!</h2>
          <p className="mt-1 text-sm text-brand-100 font-mono">Tenant ID: {user?.companyId}</p>
          <p className="mt-2 text-xs text-brand-200">
            Fleet Manager Hub — monitor operations, verify transactions, and manage company assets.
          </p>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-2xl" />
        <div className="absolute right-20 -bottom-20 h-40 w-40 rounded-full bg-brand-400/20 blur-2xl" />
      </div>

      {/* Filter Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-dark-border dark:bg-dark-card shadow-sm">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-3 border-b border-slate-100 dark:border-dark-border">
          <div className="flex items-center space-x-2 text-slate-800 dark:text-white font-semibold">
            <Filter size={18} className="text-brand-500" />
            <span>Dashboard Filters</span>
          </div>
          {(typeFilter || statusFilter || regionFilter) && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-dark-muted uppercase mb-1">
              Vehicle Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white dark:focus:border-brand-500"
            >
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-dark-muted uppercase mb-1">
              Vehicle Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white dark:focus:border-brand-500"
            >
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-dark-muted uppercase mb-1">
              Operating Region
            </label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white dark:focus:border-brand-500"
            >
              <option value="">All Regions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm hover:border-brand-400 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-dark-muted uppercase tracking-wider">Fleet Utilization</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
                {loading ? '...' : `${kpis?.utilization}%`}
              </h3>
            </div>
            <div className="rounded-lg bg-brand-50 p-2.5 text-brand-600 dark:bg-brand-950/30 dark:text-brand-400">
              <Percent size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-brand-600 dark:text-brand-400 font-semibold">
            <TrendingUp size={14} className="mr-1" />
            <span>Active assets on road</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm hover:border-brand-400 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-dark-muted uppercase tracking-wider">Total Vehicles</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
                {loading ? '...' : kpis?.totalVehicles}
              </h3>
            </div>
            <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
              <Truck size={20} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-2xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
              {loading ? '..' : kpis?.availableVehicles} Avail
            </span>
            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-2xs font-semibold text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
              {loading ? '..' : kpis?.activeVehicles} Trip
            </span>
            <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-2xs font-semibold text-red-700 dark:bg-red-950/20 dark:text-red-400">
              {loading ? '..' : kpis?.maintenanceVehicles} Shop
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm hover:border-brand-400 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-dark-muted uppercase tracking-wider">Active Trips</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
                {loading ? '...' : kpis?.activeTrips}
              </h3>
            </div>
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
              <Route size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-dark-muted">
            <span>{loading ? '..' : kpis?.pendingTrips} in Draft status</span>
            <button onClick={() => router.push('/trips')} className="inline-flex items-center text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              Manage <ArrowRight size={12} className="ml-1" />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm hover:border-brand-400 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-dark-muted uppercase tracking-wider">Total Drivers</p>
              <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">
                {loading ? '...' : kpis?.totalDrivers}
              </h3>
            </div>
            <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-dark-muted">
            <span>{loading ? '..' : kpis?.activeDrivers} active on trip</span>
            <button onClick={() => router.push('/drivers')} className="inline-flex items-center text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
              Manage <ArrowRight size={12} className="ml-1" />
            </button>
          </div>
        </div>

      </div>

      {/* Empty State Banner */}
      {!loading && kpis && kpis.totalVehicles === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center dark:border-dark-border dark:bg-dark-card shadow-sm">
          <Truck className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">No assets registered yet</h3>
          <p className="mt-1 text-sm text-slate-400 dark:text-dark-muted">
            Start by registering a vehicle and adding a driver to run transport operations.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <button
              onClick={() => router.push('/vehicles')}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 shadow-md"
            >
              Add Vehicle
            </button>
            <button
              onClick={() => router.push('/drivers')}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-dark-border dark:bg-dark-card dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Add Driver
            </button>
          </div>
        </div>
      )}

      {/* Operations Quick summary */}
      {!loading && kpis && kpis.totalVehicles > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 font-sans uppercase tracking-wider text-xs">Operations Summary</h4>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 dark:text-dark-muted">Active Fleet (trips)</span>
                <span className="font-semibold text-slate-800 dark:text-white">{kpis.activeVehicles} vehicles</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 dark:text-dark-muted">Vehicles in shop (maintenance)</span>
                <span className="font-semibold text-red-500">{kpis.maintenanceVehicles} vehicles</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 dark:text-dark-muted">Active drivers on duty</span>
                <span className="font-semibold text-slate-800 dark:text-white">{kpis.activeDrivers} drivers</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 dark:text-dark-muted">Total Available fleet size</span>
                <span className="font-semibold text-emerald-500">{kpis.availableVehicles} vehicles</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 font-sans uppercase tracking-wider text-xs">Quick Shortcuts</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/trips')}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 dark:border-dark-border dark:bg-slate-900/30 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                <Route size={20} className="text-brand-500 mb-1.5" />
                Dispatch Trip
              </button>
              <button
                onClick={() => router.push('/maintenance')}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 dark:border-dark-border dark:bg-slate-900/30 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                <Wrench size={20} className="text-red-500 mb-1.5" />
                Log Maintenance
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
