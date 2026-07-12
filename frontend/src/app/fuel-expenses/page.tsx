'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { SkeletonTable } from '../components/Skeleton';
import { 
  Plus, 
  Fuel, 
  DollarSign, 
  Calendar, 
  Truck,
  TrendingDown,
  Percent,
  X,
  CreditCard
} from 'lucide-react';

interface VehicleSummary {
  id: string;
  name: string;
  registrationNumber: string;
  odometer: number;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  totalOperationalCost: number;
}

interface FuelLog {
  id: string;
  liters: number;
  cost: number;
  date: string;
  vehicle: {
    name: string;
    registrationNumber: string;
  };
}

interface Expense {
  id: string;
  type: string;
  amount: number;
  date: string;
  vehicle: {
    name: string;
    registrationNumber: string;
  };
}

export default function FuelExpensesPage() {
  const { user } = useAuth();
  
  // Data lists
  const [vehicles, setVehicles] = useState<VehicleSummary[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: 'summary', 'fuel', 'expenses'
  const [activeTab, setActiveTab] = useState<'summary' | 'fuel' | 'expenses'>('summary');

  // Form toggles
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Fuel Form inputs
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelLiters, setFuelLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState('');
  const [fuelError, setFuelError] = useState<string | null>(null);

  // Expense Form inputs
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expType, setExpType] = useState('toll');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState('');
  const [expError, setExpError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vehiclesData, fuelData, expensesData] = await Promise.all([
        apiRequest('/vehicles'),
        apiRequest('/fuel-logs'),
        apiRequest('/expenses')
      ]);
      setVehicles(vehiclesData);
      setFuelLogs(fuelData);
      setExpenses(expensesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load expense records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddFuelLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFuelError(null);

    if (!fuelVehicleId || !fuelLiters || !fuelCost) {
      setFuelError('Please enter all required fields');
      return;
    }

    try {
      await apiRequest('/fuel-logs', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: fuelVehicleId,
          liters: fuelLiters,
          cost: fuelCost,
          date: fuelDate || null
        })
      });

      // Reset
      setFuelVehicleId('');
      setFuelLiters('');
      setFuelCost('');
      setFuelDate('');
      setShowFuelForm(false);
      fetchData();
    } catch (err: any) {
      setFuelError(err.message || 'Failed to submit fuel log');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpError(null);

    if (!expVehicleId || !expType || !expAmount) {
      setExpError('Please enter all required fields');
      return;
    }

    try {
      await apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          vehicleId: expVehicleId,
          type: expType,
          amount: expAmount,
          date: expDate || null
        })
      });

      // Reset
      setExpVehicleId('');
      setExpType('toll');
      setExpAmount('');
      setExpDate('');
      setShowExpenseForm(false);
      fetchData();
    } catch (err: any) {
      setExpError(err.message || 'Failed to submit expense log');
    }
  };

  // Check roles
  const canLogExpenses = user?.role === 'FLEET_MANAGER' || user?.role === 'DRIVER' || user?.role === 'ADMIN';

  // Calculate totals
  const totalFleetSpent = vehicles.reduce((sum, v) => sum + v.totalOperationalCost, 0);
  const totalFuelSpent = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalOtherSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 animate-slideUp">
      
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Fuel & Expenses</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Log operational purchases and track combined cost centers per vehicle.</p>
        </div>
        {canLogExpenses && (
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => { setShowFuelForm(true); setShowExpenseForm(false); }}
              className="btn-primary px-3.5 py-2 text-xs"
            >
              <Fuel size={14} />
              <span>Log Fuel</span>
            </button>
            <button
              onClick={() => { setShowExpenseForm(true); setShowFuelForm(false); }}
              className="btn-ghost px-3.5 py-2 text-xs"
            >
              <DollarSign size={14} />
              <span>Log Expense</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="ops-panel p-4">
          <p className="text-xs font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}>Total Fleet Expenses</p>
          <p className="text-2xl font-extrabold mt-1" style={{ color: 'var(--color-text-primary)' }}>
            ₹{totalFleetSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="ops-panel p-4">
          <p className="text-xs font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}>Total Fuel Costs</p>
          <p className="text-2xl font-extrabold mt-1" style={{ color: 'var(--color-text-primary)' }}>
            ₹{totalFuelSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="ops-panel p-4">
          <p className="text-xs font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}>Other Combined Expenses</p>
          <p className="text-2xl font-extrabold mt-1" style={{ color: 'var(--color-text-primary)' }}>
            ₹{totalOtherSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Fuel Log Entry Modal */}
      {showFuelForm && canLogExpenses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md ops-panel p-6">
            <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="font-bold flex items-center" style={{ color: 'var(--color-text-primary)' }}>
                <Fuel size={18} className="mr-2" style={{ color: 'var(--color-signal-amber)' }} />
                <span>Log Vehicle Refuel Receipt</span>
              </h3>
              <button onClick={() => setShowFuelForm(false)} className="hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {fuelError && (
              <div className="mb-4 rounded bg-red-50 p-3 text-xs font-semibold text-[var(--color-signal-red)]">
                {fuelError}
              </div>
            )}

            <form onSubmit={handleAddFuelLog} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Select Vehicle *</label>
                <select
                  required
                  value={fuelVehicleId}
                  onChange={(e) => setFuelVehicleId(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Fuel Liters *</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.01"
                    placeholder="e.g. 85.5"
                    value={fuelLiters}
                    onChange={(e) => setFuelLiters(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Total Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.01"
                    placeholder="e.g. 120"
                    value={fuelCost}
                    onChange={(e) => setFuelCost(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Receipt Date</label>
                <input
                  type="date"
                  value={fuelDate}
                  onChange={(e) => setFuelDate(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-sm"
              >
                Log Fuel Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Other Expense Entry Modal */}
      {showExpenseForm && canLogExpenses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md ops-panel p-6">
            <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="font-bold flex items-center" style={{ color: 'var(--color-text-primary)' }}>
                <CreditCard size={18} className="mr-2" style={{ color: 'var(--color-signal-amber)' }} />
                <span>Log Miscellaneous Expense</span>
              </h3>
              <button onClick={() => setShowExpenseForm(false)} className="hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {expError && (
              <div className="mb-4 rounded bg-red-50 p-3 text-xs font-semibold text-[var(--color-signal-red)]">
                {expError}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Select Vehicle *</label>
                <select
                  required
                  value={expVehicleId}
                  onChange={(e) => setExpVehicleId(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.registrationNumber})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Expense Type *</label>
                  <select
                    value={expType}
                    onChange={(e) => setExpType(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="toll">Toll / Highway</option>
                    <option value="maintenance">Maintenance log</option>
                    <option value="misc">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Total Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.01"
                    placeholder="e.g. 45"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Expense Date</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-sm"
              >
                Log Expense Log
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-dark-border">
        <nav className="-mb-px flex space-x-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'summary' ? 'border-[var(--color-signal-amber)] text-[var(--color-signal-amber)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
          >
            Vehicle Expenses Summary
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'fuel' ? 'border-[var(--color-signal-amber)] text-[var(--color-signal-amber)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
          >
            Fuel Logs ({fuelLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-3 border-b-2 transition-colors ${activeTab === 'expenses' ? 'border-[var(--color-signal-amber)] text-[var(--color-signal-amber)]' : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
          >
            Other Expenses ({expenses.length})
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : activeTab === 'summary' ? (
        <div className="overflow-x-auto ops-panel">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(35,43,55,0.4)', color: 'var(--color-text-muted)' }}>
              <tr>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Odometer</th>
                <th className="px-6 py-4 text-right">Fuel Logs</th>
                <th className="px-6 py-4 text-right">Maintenance logs</th>
                <th className="px-6 py-4 text-right">Other Expenses</th>
                <th className="px-6 py-4 text-right bg-slate-50/30 dark:bg-slate-900/20 font-bold">Total Operations Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {vehicles.map((v) => (
                <tr key={v.id} className="transition-colors hover:bg-[var(--color-surface-raised)]">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg p-2" style={{ background: 'rgba(255,176,32,0.12)', color: 'var(--color-signal-amber)' }}>
                        <Truck size={18} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{v.name}</p>
                        <span className="font-mono text-2xs text-[var(--color-text-muted)] dark:text-dark-muted bg-[var(--color-surface-raised)] px-1 py-0.5 rounded">{v.registrationNumber}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-[var(--color-text-muted)] text-xs">
                    {v.odometer.toLocaleString()} km
                  </td>
                  <td className="px-6 py-4 text-right text-[var(--color-text-muted)] font-medium">
                    ₹{v.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-[var(--color-text-muted)] font-medium">
                    ₹{v.maintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-[var(--color-text-muted)] font-medium">
                    ₹{v.expenseCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right bg-[var(--color-surface-raised)] font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    ₹{v.totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No vehicle expenses compiled yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : activeTab === 'fuel' ? (
        <div className="overflow-x-auto ops-panel">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(35,43,55,0.4)', color: 'var(--color-text-muted)' }}>
              <tr>
                <th className="px-6 py-4">Receipt Date</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Fuel Vol (Liters)</th>
                <th className="px-6 py-4 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {fuelLogs.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-[var(--color-surface-raised)]">
                  <td className="px-6 py-4 text-[var(--color-text-muted)] font-medium">
                    {new Date(log.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-primary)]">
                    <p className="font-semibold">{log.vehicle.name}</p>
                    <span className="font-mono text-2xs text-[var(--color-text-muted)]">{log.vehicle.registrationNumber}</span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)] font-mono">
                    {log.liters.toLocaleString()} L
                  </td>
                  <td className="px-6 py-4 text-right font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    ₹{log.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {fuelLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No refuel logs registered yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto ops-panel">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(35,43,55,0.4)', color: 'var(--color-text-muted)' }}>
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Expense Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {expenses.map((exp) => (
                <tr key={exp.id} className="transition-colors hover:bg-[var(--color-surface-raised)]">
                  <td className="px-6 py-4 text-[var(--color-text-muted)] font-medium">
                    {new Date(exp.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-primary)]">
                    <p className="font-semibold">{exp.vehicle.name}</p>
                    <span className="font-mono text-2xs text-[var(--color-text-muted)]">{exp.vehicle.registrationNumber}</span>
                  </td>
                  <td className="px-6 py-4 capitalize text-[var(--color-text-muted)]">
                    <span className="inline-flex rounded px-2 py-0.5 text-2xs font-semibold" style={{ background: 'var(--color-surface-raised)', color: 'var(--color-text-muted)' }}>{exp.type}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    ₹{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[var(--color-text-muted)]">No other expenses logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
