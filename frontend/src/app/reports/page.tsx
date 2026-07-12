'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { SkeletonGrid } from '../components/Skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Download, 
  Printer, 
  TrendingUp, 
  AlertTriangle,
  Award,
  Gauge,
  Percent
} from 'lucide-react';

interface FuelEfficiency {
  vehicleId: string;
  registrationNumber: string;
  name: string;
  totalDistance: number;
  totalFuel: number;
  efficiency: number;
}

interface Utilization {
  vehicleId: string;
  registrationNumber: string;
  name: string;
  type: string;
  status: string;
  totalTrips: number;
  completedTrips: number;
  activeTrips: number;
  tripUtilizationRate: number;
}

interface ROI {
  vehicleId: string;
  registrationNumber: string;
  name: string;
  acquisitionCost: number;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalOperationalCost: number;
  estimatedRevenue: number;
  netProfit: number;
  roi: number;
}

export default function ReportsPage() {
  const { user } = useAuth();
  
  const [efficiencyData, setEfficiencyData] = useState<FuelEfficiency[]>([]);
  const [utilizationData, setUtilizationData] = useState<Utilization[]>([]);
  const [roiData, setRoiData] = useState<ROI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Hydration protection for Recharts
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eff, util, roi] = await Promise.all([
          apiRequest('/reports/fuel-efficiency'),
          apiRequest('/reports/utilization'),
          apiRequest('/reports/roi')
        ]);
        setEfficiencyData(eff);
        setUtilizationData(util);
        setRoiData(roi);
      } catch (err: any) {
        setError(err.message || 'Failed to compile report metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleCSVExport = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/reports/export.csv`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Download request failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transitops_fleet_report_${new Date().toISOString().substring(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Failed to download report');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isFinancialOrManager = user?.role === 'FLEET_MANAGER' || user?.role === 'FINANCIAL_ANALYST';

  if (!isFinancialOrManager) {
    return (
      <div className="rounded-lg border p-6 text-center" style={{ background: 'rgba(255,176,32,0.08)', borderColor: 'rgba(255,176,32,0.3)' }}>
        <AlertTriangle className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-signal-amber)' }} />
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-signal-amber)' }}>Access Denied</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-signal-amber)' }}>
          Only Fleet Managers and Financial Analysts have permissions to review operational reports.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border p-6 text-center" style={{ background: 'rgba(255,92,92,0.08)', borderColor: 'rgba(255,92,92,0.3)' }}>
        <AlertTriangle className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-signal-red)' }} />
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-signal-red)' }}>Failed to generate reports</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-signal-red)' }}>{error}</p>
      </div>
    );
  }

  // Calculate status pie chart data
  const statusCounts = utilizationData.reduce((acc: any, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusCounts).map(status => ({
    name: status.replace('_', ' '),
    value: statusCounts[status]
  }));

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6 animate-slideUp print:space-y-4 print:p-0">
      
      {/* Header and Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 print:hidden">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Fleet Performance Reports</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Review financial return, fuel efficiencies, and fleet capacity usage.</p>
        </div>
        <div className="flex space-x-2.5">
          <button
            onClick={handleCSVExport}
            className="btn-primary px-4 py-2.5 text-xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn-ghost px-4 py-2.5 text-xs"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={4} />
      ) : roiData.length === 0 ? (
        <div className="ops-panel p-8 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <h3 className="text-md font-bold" style={{ color: 'var(--color-text-muted)' }}>No report data generated yet</h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>You must log vehicles and completed trips to aggregate analytical metrics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Chart 1: ROI */}
          <div className="ops-panel p-5 print:shadow-none">
            <div className="mb-4">
              <h3 className="font-bold flex items-center" style={{ color: 'var(--color-text-primary)' }}>
                <Award size={18} className="text-[var(--color-signal-amber)] mr-2" />
                <span>Return on Investment (ROI) per Vehicle</span>
              </h3>
              <p className="text-2xs text-[var(--color-text-muted)]">Net Profit relative to Acquisition Costs (%)</p>
            </div>
            <div className="h-80 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} unit="%" />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="roi" name="ROI %" fill="#0e90e9" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 2: Fuel Efficiency */}
          <div className="ops-panel p-5 print:shadow-none">
            <div className="mb-4">
              <h3 className="font-bold flex items-center" style={{ color: 'var(--color-text-primary)' }}>
                <Gauge size={18} className="text-[var(--color-signal-green)] mr-2" />
                <span>Fuel Efficiency by Asset</span>
              </h3>
              <p className="text-2xs text-[var(--color-text-muted)]">Kilometers driven per Liter of fuel (km/L)</p>
            </div>
            <div className="h-80 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={efficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} unit=" km/L" />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="efficiency" name="Efficiency (km/L)" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 3: Fleet Status Allocation */}
          <div className="ops-panel p-5 print:shadow-none">
            <div className="mb-4">
              <h3 className="font-bold flex items-center" style={{ color: 'var(--color-text-primary)' }}>
                <TrendingUp size={18} className="text-indigo-500 mr-2" />
                <span>Fleet Asset Allocation</span>
              </h3>
              <p className="text-2xs text-[var(--color-text-muted)]">Distribution of vehicle status across fleet registry</p>
            </div>
            <div className="h-80 w-full flex flex-col sm:flex-row items-center justify-center">
              {mounted && pieData.length > 0 ? (
                <>
                  <div className="h-64 w-64 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-6 space-y-2">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center text-xs">
                        <span className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="font-semibold capitalize" style={{ color: 'var(--color-text-primary)' }}>{entry.name}:</span>
                        <span className="ml-1.5 font-bold text-[var(--color-text-primary)]">{entry.value} vehicles</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No allocation data to map.</p>
              )}
            </div>
          </div>

          {/* Chart 4: Trip Utilization Rate */}
          <div className="ops-panel p-5 print:shadow-none">
            <div className="mb-4">
              <h3 className="font-bold flex items-center" style={{ color: 'var(--color-text-primary)' }}>
                <Percent size={18} className="text-[var(--color-signal-amber)] mr-2" />
                <span>Vehicle Dispatch Utilization Rate</span>
              </h3>
              <p className="text-2xs text-[var(--color-text-muted)]">Active and completed runs over total registered runs (%)</p>
            </div>
            <div className="h-80 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} max={100} unit="%" />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar dataKey="tripUtilizationRate" name="Utilization Rate (%)" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={45} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}

      {/* A4 Printable Stylesheet override */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, aside, .print\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          .grid {
            grid-template-cols: 1fr !important;
          }
          .h-80 {
            height: 250px !important;
          }
        }
      `}</style>

    </div>
  );
}
