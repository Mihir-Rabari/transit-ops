'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { 
  Truck, 
  ShieldCheck, 
  DollarSign, 
  Route, 
  Users, 
  ArrowRight, 
  BarChart3, 
  FileText, 
  Layers,
  Sparkles,
  Zap,
  Globe,
  Settings
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-brand-500 selection:text-white font-sans overflow-x-hidden">
      
      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold shadow-lg shadow-brand-500/20 text-lg">
              TO
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              TransitOps
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <Link 
                href="/dashboard" 
                className="flex items-center space-x-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 shadow-md hover:shadow-brand-500/10 transition-all"
              >
                <span>Console Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/login?register=true" 
                  className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-700 hover:border-slate-600 transition-all"
                >
                  Create Tenant
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center lg:pt-32 lg:pb-24 relative">
        <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700/50 rounded-full px-3 py-1.5 text-xs text-brand-400 font-semibold mb-6 animate-pulse">
          <Sparkles size={12} />
          <span>Multi-Tenant Enterprise SaaS Platform</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] text-white">
          Real-Time Fleet Operations,{' '}
          <span className="bg-gradient-to-r from-brand-400 via-brand-500 to-emerald-400 bg-clip-text text-transparent">
            Reimagined.
          </span>
        </h1>
        
        <p className="mt-6 text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The ultimate multi-tenant logistics orchestration engine. Track operational cost metrics, run transactional dispatches, attach manifests, and secure safety ledgers.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {user ? (
            <Link 
              href="/dashboard" 
              className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-brand-600 px-8 py-4 text-base font-bold text-white hover:bg-brand-700 shadow-xl shadow-brand-500/10 transition-all transform hover:-translate-y-0.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link 
                href="/login" 
                className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-brand-600 px-8 py-4 text-base font-bold text-white hover:bg-brand-700 shadow-xl shadow-brand-500/10 transition-all transform hover:-translate-y-0.5"
              >
                <span>Access Console</span>
                <Zap size={18} />
              </Link>
              <Link 
                href="/login" 
                onClick={() => {
                  // Wait, we can append a custom trigger or query state so it opens registration
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('register_flag', 'true');
                  }
                }}
                className="w-full sm:w-auto rounded-xl bg-slate-800 border border-slate-700 px-8 py-4 text-base font-bold text-slate-200 hover:bg-slate-700 hover:border-slate-600 hover:text-white transition-all transform hover:-translate-y-0.5"
              >
                Onboard Company Tenant
              </Link>
            </>
          )}
        </div>

        {/* Floating Mock UI Element */}
        <div className="mt-16 border border-slate-800 rounded-2xl bg-slate-900/60 p-2 shadow-2xl max-w-4xl mx-auto backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 md:p-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center space-x-2">
                <span className="h-3.5 w-3.5 rounded-full bg-red-500/80" />
                <span className="h-3.5 w-3.5 rounded-full bg-yellow-500/80" />
                <span className="h-3.5 w-3.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-2xs font-mono text-slate-500">HTTPS://APP.TRANSITOPS.COM/CONSOLE</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-lg bg-slate-900 border border-slate-800/80 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xs font-bold text-slate-500 uppercase tracking-wider">Fleet Utilization</p>
                    <p className="text-2xl font-extrabold text-white mt-1">94%</p>
                  </div>
                  <div className="rounded-lg bg-brand-500/10 p-2 text-brand-400">
                    <Truck size={16} />
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg bg-slate-900 border border-slate-800/80 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xs font-bold text-slate-500 uppercase tracking-wider">Active Deliveries</p>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">12 Ongoing</p>
                  </div>
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
                    <Route size={16} />
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-slate-900 border border-slate-800/80 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-3xs font-bold text-slate-500 uppercase tracking-wider">Company Tenant Scope</p>
                    <p className="text-2xl font-extrabold text-indigo-400 mt-1 font-mono">ACME-F1</p>
                  </div>
                  <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                    <Layers size={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Feature Section */}
      <section className="bg-slate-950 py-20 border-t border-slate-850">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-white">Full-Stack Operational Intelligence</h2>
            <p className="text-sm text-slate-400 mt-3">Every module in TransitOps is built to fulfill critical business rules, verified through database transactions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="rounded-xl bg-slate-900 border border-slate-850 p-6 space-y-4 hover:border-brand-500/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                <Layers size={20} />
              </div>
              <h3 className="font-bold text-lg text-white">Multi-Tenant Partitioning</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Register your organization to get a custom Tenant ID. Every user session, vehicle registry, driver profile, and expense log is securely partitioned.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl bg-slate-900 border border-slate-850 p-6 space-y-4 hover:border-brand-500/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Route size={20} />
              </div>
              <h3 className="font-bold text-lg text-white">Kanban State Machines</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Dispatch, complete, or cancel trip dispatches. State changes require transactional execution, automatically updating fleet status records.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl bg-slate-900 border border-slate-850 p-6 space-y-4 hover:border-brand-500/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-lg text-white">S3 Manifest Attachments</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Upload Bills of Lading, transit receipts, and driving credentials directly to AWS S3, with automatic fallback storage built-in.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl bg-slate-900 border border-slate-850 p-6 space-y-4 hover:border-brand-500/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-lg text-white">Role-Based Workspaces</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Unique terminals customized for Administrators, Fleet Managers, Drivers, Safety Compliance, and Financial Analysts.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-xl bg-slate-900 border border-slate-850 p-6 space-y-4 hover:border-brand-500/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-lg text-white">Safety & Compliance Audit</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Monitor driver safety scores and enforce commercial license expiries. Automatic systems suspend drivers with expired records.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-xl bg-slate-900 border border-slate-850 p-6 space-y-4 hover:border-brand-500/50 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400">
                <DollarSign size={20} />
              </div>
              <h3 className="font-bold text-lg text-white">Financial ROI Ledger</h3>
              <p className="text-xs leading-relaxed text-slate-400">
                Audit fuel logs, tolls, and maintenance expenditures to evaluate live net profits and performance charts.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/40 py-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-brand-600 flex items-center justify-center text-white font-bold text-xs">TO</div>
            <span className="font-bold text-slate-300">TransitOps SaaS</span>
          </div>
          <p>© 2026 TransitOps, Inc. All rights reserved. Built for secure transport logistics.</p>
        </div>
      </footer>

    </div>
  );
}
