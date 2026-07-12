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
  Activity
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
      <div className="ops-panel p-6 text-center" style={{ borderColor: 'rgba(255, 92, 92, 0.3)' }}>
        <AlertTriangle className="mx-auto h-10 w-10 mb-3" style={{ color: 'var(--color-signal-red)' }} />
        <h3 className="text-scale-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Error loading dashboard
        </h3>
        <p className="mt-1 text-scale-sm" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        <button
          onClick={fetchKPIs}
          className="btn-primary mt-4"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slideUp">

      {/* ── Top bar: tenant info + refresh ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="telemetry text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Operations Console
          </p>
          <p className="telemetry text-xs mt-0.5" style={{ color: 'var(--color-signal-amber)' }}>
            {user?.companyId?.substring(0, 16)}…
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 telemetry text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            <Activity size={12} className="animate-pulse" style={{ color: 'var(--color-signal-green)' }} />
            Live
          </span>
          <button
            onClick={fetchKPIs}
            className="btn-ghost text-xs"
            disabled={loading}
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── KPI Tiles — live ops board feel ────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

        {/* Fleet Utilization */}
        <div className="kpi-tile">
          <span className="kpi-tile__label">Fleet Utilization</span>
          <span className="kpi-tile__value">
            {loading ? '—' : `${kpis?.utilization ?? 0}%`}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <Percent size={12} style={{ color: 'var(--color-text-muted)' }} />
            <span className="telemetry text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {loading ? '—' : `${kpis?.activeVehicles ?? 0} on trip / ${kpis?.totalVehicles ?? 0} total`}
            </span>
          </div>
        </div>

        {/* Total Vehicles */}
        <div className="kpi-tile">
          <span className="kpi-tile__label">Total Vehicles</span>
          <span className="kpi-tile__value">
            {loading ? '—' : kpis?.totalVehicles ?? 0}
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="telemetry text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {loading ? '—' : `${kpis?.availableVehicles ?? 0} available`}
            </span>
            <button
              onClick={() => router.push('/vehicles')}
              className="flex items-center gap-1 text-[10px] telemetry hover:underline"
              style={{ color: 'var(--color-signal-amber)' }}
            >
              Manage <ArrowRight size={10} />
            </button>
          </div>
        </div>

        {/* Active Trips */}
        <div className="kpi-tile">
          <span className="kpi-tile__label">Active Trips</span>
          <span className="kpi-tile__value">
            {loading ? '—' : kpis?.activeTrips ?? 0}
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="telemetry text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {loading ? '—' : `${kpis?.pendingTrips ?? 0} in Draft`}
            </span>
            <button
              onClick={() => router.push('/trips')}
              className="flex items-center gap-1 text-[10px] telemetry hover:underline"
              style={{ color: 'var(--color-signal-amber)' }}
            >
              Manage <ArrowRight size={10} />
            </button>
          </div>
        </div>

        {/* Total Drivers */}
        <div className="kpi-tile">
          <span className="kpi-tile__label">Total Drivers</span>
          <span className="kpi-tile__value">
            {loading ? '—' : kpis?.totalDrivers ?? 0}
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="telemetry text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {loading ? '—' : `${kpis?.activeDrivers ?? 0} on trip`}
            </span>
            <button
              onClick={() => router.push('/drivers')}
              className="flex items-center gap-1 text-[10px] telemetry hover:underline"
              style={{ color: 'var(--color-signal-amber)' }}
            >
              Manage <ArrowRight size={10} />
            </button>
          </div>
        </div>

      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="ops-panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3"
             style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 text-sm font-medium"
               style={{ color: 'var(--color-text-primary)', fontFamily: "'Space Grotesk'" }}>
            <Filter size={16} style={{ color: 'var(--color-signal-amber)' }} />
            <span>Dashboard Filters</span>
          </div>
          {(typeFilter || statusFilter || regionFilter) && (
            <button
              onClick={clearFilters}
              className="text-xs telemetry hover:underline"
              style={{ color: 'var(--color-signal-amber)' }}
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mt-4">
          <div>
            <label className="block telemetry text-[10px] uppercase tracking-wider mb-1.5"
                   style={{ color: 'var(--color-text-muted)' }}>
              Vehicle Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{
                background: 'var(--color-base)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: "'IBM Plex Sans'"
              }}
            >
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block telemetry text-[10px] uppercase tracking-wider mb-1.5"
                   style={{ color: 'var(--color-text-muted)' }}>
              Vehicle Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{
                background: 'var(--color-base)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: "'IBM Plex Sans'"
              }}
            >
              <option value="">All Statuses</option>
              {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>

          <div>
            <label className="block telemetry text-[10px] uppercase tracking-wider mb-1.5"
                   style={{ color: 'var(--color-text-muted)' }}>
              Operating Region
            </label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1"
              style={{
                background: 'var(--color-base)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
                fontFamily: "'IBM Plex Sans'"
              }}
            >
              <option value="">All Regions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Empty State ─────────────────────────────────────────── */}
      {!loading && kpis && kpis.totalVehicles === 0 && (
        <div className="ops-panel p-8 text-center" style={{ borderStyle: 'dashed' }}>
          <Truck className="mx-auto h-10 w-10 mb-3" style={{ color: 'var(--color-border)' }} />
          <h3 className="text-scale-lg font-display font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            No assets registered yet
          </h3>
          <p className="mt-1 text-scale-sm" style={{ color: 'var(--color-text-muted)' }}>
            Start by registering a vehicle and adding a driver to run transport operations.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => router.push('/vehicles')}
              className="btn-primary"
            >
              Add Vehicle
            </button>
            <button
              onClick={() => router.push('/drivers')}
              className="btn-ghost"
            >
              Add Driver
            </button>
          </div>
        </div>
      )}

      {/* ── Operations Summary + Shortcuts ─────────────────────── */}
      {!loading && kpis && kpis.totalVehicles > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

          {/* Summary */}
          <div className="ops-panel p-5">
            <h4 className="telemetry text-[10px] uppercase tracking-wider mb-4"
                style={{ color: 'var(--color-text-muted)' }}>
              Operations Summary
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text-muted)' }}>Active Fleet (trips)</span>
                <span className="telemetry font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {kpis.activeVehicles} vehicles
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text-muted)' }}>Vehicles in shop (maintenance)</span>
                <span className="telemetry font-medium" style={{ color: 'var(--color-signal-red)' }}>
                  {kpis.maintenanceVehicles} vehicles
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text-muted)' }}>Active drivers on duty</span>
                <span className="telemetry font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {kpis.activeDrivers} drivers
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: 'var(--color-text-muted)' }}>Total Available fleet size</span>
                <span className="telemetry font-medium" style={{ color: 'var(--color-signal-green)' }}>
                  {kpis.availableVehicles} vehicles
                </span>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="ops-panel p-5">
            <h4 className="telemetry text-[10px] uppercase tracking-wider mb-4"
                style={{ color: 'var(--color-text-muted)' }}>
              Quick Shortcuts
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push('/trips')}
                className="btn-ghost text-sm justify-center py-3"
              >
                <Route size={16} />
                Dispatch Trip
              </button>
              <button
                onClick={() => router.push('/maintenance')}
                className="btn-ghost text-sm justify-center py-3"
              >
                <Wrench size={16} />
                Log Maintenance
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
