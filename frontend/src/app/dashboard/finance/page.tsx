'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  DollarSign,
  Wrench,
  Fuel,
  ShieldAlert,
  ArrowUpRight,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface ROIRecord {
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

export default function FinanceDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [roiData, setRoiData] = useState<ROIRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Protect client side
  useEffect(() => {
    if (user && user.role !== 'FINANCIAL_ANALYST' && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const loadFinancialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/reports/roi');
      setRoiData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch financial ROI reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && (user.role === 'FINANCIAL_ANALYST' || user.role === 'ADMIN')) {
      loadFinancialData();
    }
  }, [user, loadFinancialData]);

  const handleExportCSV = async () => {
    try {
      const csvContent = await apiRequest('/reports/export-csv');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `fleet_financial_ledger_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Failed to export CSV report');
    }
  };

  if (user?.role !== 'FINANCIAL_ANALYST' && user?.role !== 'ADMIN') {
    return null;
  }

  // Summary sums
  const totalAcquisition = roiData.reduce((sum, r) => sum + r.acquisitionCost, 0);
  const totalFuel = roiData.reduce((sum, r) => sum + r.fuelCost, 0);
  const totalMaintenance = roiData.reduce((sum, r) => sum + r.maintenanceCost, 0);
  const totalExpenses = roiData.reduce((sum, r) => sum + r.expenseCost, 0);
  const totalOps = totalFuel + totalMaintenance + totalExpenses;
  const totalRevenue = roiData.reduce((sum, r) => sum + r.estimatedRevenue, 0);
  const totalProfit = totalRevenue - totalOps;

  const averageRoi = roiData.length > 0
    ? parseFloat((totalProfit / (totalAcquisition || 1) * 100).toFixed(2))
    : 0;

  // Pie chart data
  const pieData = [
    { name: 'Fuel', value: totalFuel, color: '#f59e0b' },
    { name: 'Maintenance', value: totalMaintenance, color: '#ef4444' },
    { name: 'Misc Expenses', value: totalExpenses, color: '#6366f1' }
  ].filter(p => p.value > 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Financial Intelligence Terminal
          </h2>
          <p className="text-sm font-mono" style={{ color: 'var(--color-text-muted)' }}>
            Tenant: {user.companyId}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn-primary flex items-center space-x-2 px-4 py-2 text-sm font-semibold"
        >
          <Download size={16} />
          <span>Export Ledger CSV</span>
        </button>
      </div>

      {loading ? (
        <div className="ops-panel flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid" style={{ borderColor: 'var(--color-border)', borderRightColor: 'transparent' }} />
        </div>
      ) : error ? (
        <div className="ops-panel p-6 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-signal-red)' }} />
          <h3 className="text-lg font-bold font-display" style={{ color: 'var(--color-text-primary)' }}>
            Failed to load financial records
          </h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Cost Summary Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">

            {/* Total Profit */}
            <div className="kpi-tile">
              <p className="kpi-tile__label">Net Profit (YTD)</p>
              <h3 className="kpi-tile__value telemetry mt-1" style={{ color: totalProfit >= 0 ? 'var(--color-signal-green)' : 'var(--color-signal-red)' }}>
                ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <div className="mt-2 flex items-center text-xs font-semibold" style={{ color: 'var(--color-signal-green)' }}>
                <TrendingUp size={14} className="mr-1" />
                <span>Estimated revenue ROI: {averageRoi}%</span>
              </div>
            </div>

            {/* Total Operational Cost */}
            <div className="kpi-tile">
              <p className="kpi-tile__label">Operational Cost</p>
              <h3 className="kpi-tile__value telemetry mt-1" style={{ color: 'var(--color-text-primary)' }}>
                ${totalOps.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <div className="mt-2 flex items-center text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <span>Total spent running fleet</span>
              </div>
            </div>

            {/* Fuel Cost */}
            <div className="kpi-tile">
              <p className="kpi-tile__label">Total Fuel spend</p>
              <h3 className="kpi-tile__value telemetry mt-1" style={{ color: 'var(--color-text-primary)' }}>
                ${totalFuel.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <div className="mt-2 flex items-center text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <span>Calculated via fuel logs</span>
              </div>
            </div>

            {/* Maintenance Cost */}
            <div className="kpi-tile">
              <p className="kpi-tile__label">Maintenance spend</p>
              <h3 className="kpi-tile__value telemetry mt-1" style={{ color: 'var(--color-text-primary)' }}>
                ${totalMaintenance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <div className="mt-2 flex items-center text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                <span>Calculated via workshop logs</span>
              </div>
            </div>

          </div>

          {/* Recharts Analytics Charts */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* ROI Bar Chart */}
            <div className="lg:col-span-2 ops-panel p-5">
              <h3 className="font-display text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
                Fleet Profitability Comparison
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="registrationNumber" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="estimatedRevenue" name="Revenue ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalOperationalCost" name="Operational Cost ($)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Breakdown Pie Chart */}
            <div className="ops-panel p-5">
              <h3 className="font-display text-sm font-bold mb-4 uppercase tracking-wider" style={{ color: 'var(--color-text-primary)' }}>
                Operating Expenses Share
              </h3>
              {pieData.length === 0 ? (
                <p className="text-xs text-center py-24" style={{ color: 'var(--color-text-muted)' }}>
                  No expenses recorded yet.
                </p>
              ) : (
                <div className="h-60 w-full relative">
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
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="mt-4 flex flex-col space-y-2 text-xs">
                    {pieData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span style={{ color: 'var(--color-text-muted)' }}>{item.name}</span>
                        </div>
                        <span className="font-bold telemetry" style={{ color: 'var(--color-text-primary)' }}>
                          ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </>
      )}

    </div>
  );
}
