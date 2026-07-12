'use client';

import React from 'react';
import Link from 'next/link';
import { Truck, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh', color: 'var(--color-text-primary)' }}>
      
      {/* Navigation */}
      <nav style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-base)' }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ background: 'var(--color-signal-amber)', color: '#0D1117' }}
                 className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm font-display">
              <Truck size={16} />
            </div>
            <span className="font-display font-semibold text-base tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}>
              TransitOps
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme} 
              className="p-1.5 rounded-md hover:bg-[var(--color-surface-raised)] transition-colors focus:outline-none"
              style={{ color: 'var(--color-text-muted)' }}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link href="/login"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                  className="btn-ghost text-sm hidden sm:flex">
              Sign in
            </Link>
            <Link href="/login"
                  className="btn-primary text-sm">
              Get Access
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="max-w-3xl mx-auto mb-12">
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6"
              style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.020em' }}>
            Stop running your fleet <br className="hidden sm:inline" />
            <span style={{ color: 'var(--color-signal-amber)' }}>from a spreadsheet.</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
            TransitOps handles the critical rules you currently enforce manually — blocking dispatches on expired licenses, cargo limits, and real-time odometer logging.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/login" className="btn-primary">
              Access Console →
            </Link>
            <Link href="/login" className="btn-ghost">
              Register Company
            </Link>
          </div>
        </div>

        {/* Platform 16:9 Screenshot */}
        <div className="max-w-5xl mx-auto mt-12 rounded-xl overflow-hidden shadow-2xl border"
             style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', aspectRatio: '16/9' }}>
          <img 
            src="/dashboard-preview.png" 
            alt="TransitOps Fleet Operations Dashboard Console Preview" 
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Clean Features Grid */}
      <section style={{ borderTop: '1px solid var(--color-border)' }} className="py-20 bg-opacity-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              Built for real-world enforcement
            </h2>
            <p className="mt-4 text-sm max-w-lg mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              Spreadsheets are prone to errors and omissions. TransitOps enforces rules natively at the database layer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'No Double Booking',
                desc: 'Prevent assigning the same truck or driver to overlapping routes. Real-time availability rules block dispatch automatically.',
                icon: '📅'
              },
              {
                title: 'License & Compliance Checks',
                desc: 'Drivers with expired licenses or missing safety documentation are immediately flagged and blocked from dispatch.',
                icon: '🛡️'
              },
              {
                title: 'Odometer Integrity',
                desc: 'Require trip distances and fuel consumption logs to be submitted on trip completion, updating vehicle metrics instantly.',
                icon: '📊'
              }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-lg border flex flex-col items-start"
                   style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <span className="text-3xl mb-4">{f.icon}</span>
                <h3 className="font-display font-semibold text-lg mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Structured Workflow Section */}
      <section style={{ borderTop: '1px solid var(--color-border)' }} className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl" style={{ color: 'var(--color-text-primary)' }}>
              Enforced Trip Lifecycle
            </h2>
            <p className="mt-4 text-sm max-w-lg mx-auto" style={{ color: 'var(--color-text-muted)' }}>
              Every trip progresses through strict operational states to guarantee data integrity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                label: 'DRAFT',
                color: 'var(--color-text-muted)',
                rules: [
                  'Vehicle status must be AVAILABLE',
                  'Driver status must be AVAILABLE',
                  'Cargo weight checked against payload capacity'
                ]
              },
              {
                step: '02',
                label: 'DISPATCHED',
                color: 'var(--color-signal-amber)',
                rules: [
                  'Vehicle and driver set to ON_TRIP',
                  'Driver license validity verified at dispatch time',
                  'Mid-trip changes are locked automatically'
                ]
              },
              {
                step: '03a',
                label: 'COMPLETED',
                color: 'var(--color-signal-green)',
                rules: [
                  'Actual distance and fuel inputs required',
                  'Odometer increments updated automatically',
                  'Vehicle status set back to AVAILABLE'
                ]
              },
              {
                step: '03b',
                label: 'CANCELLED',
                color: 'var(--color-signal-red)',
                rules: [
                  'Trips revert driver and vehicle status',
                  'Preserved for auditing and logs',
                  'Prevents ghost logs and deleted histories'
                ]
              }
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }} className="p-6 rounded-lg border">
                <div className="flex items-center gap-3 mb-6">
                  <span className="telemetry text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {s.step}
                  </span>
                  <span className="status-badge" style={{
                    background: `${s.color}18`,
                    color: s.color,
                    borderColor: `${s.color}30`,
                  }}>
                    {s.label}
                  </span>
                </div>
                <ul className="space-y-3">
                  {s.rules.map((rule, idx) => (
                    <li key={idx} className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                      • {rule}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border)' }} className="py-12 bg-black bg-opacity-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div style={{ background: 'var(--color-signal-amber)', color: '#0D1117' }}
                 className="h-6 w-6 rounded-lg flex items-center justify-center font-bold text-xs font-display">
              <Truck size={12} />
            </div>
            <span className="font-display font-semibold text-sm" style={{ color: 'var(--color-text-muted)' }}>
              TransitOps
            </span>
          </div>
          <p className="telemetry text-xs" style={{ color: 'var(--color-text-muted)' }}>
            © 2026 TransitOps, Inc. Fleet operations software.
          </p>
        </div>
      </footer>

    </div>
  );
}
