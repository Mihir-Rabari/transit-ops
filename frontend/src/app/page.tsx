'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// ─── Live Status Board Data ────────────────────────────────────────────────
const FLEET_INITIAL = [
  { id: 'MH-04-AB-1123', type: 'Semi-Trailer',    driver: 'R. Mehta',     status: 'ontrip'    as const },
  { id: 'KA-09-CD-4471', type: 'Tempo Traveller', driver: 'S. Kumar',     status: 'available' as const },
  { id: 'DL-01-EF-8820', type: 'Container Truck', driver: 'P. Sharma',    status: 'ontrip'    as const },
  { id: 'TN-22-GH-3302', type: 'Flatbed',         driver: '—',            status: 'inshop'    as const },
  { id: 'GJ-05-JK-7714', type: 'Refrigerator Van',driver: 'A. Patel',    status: 'available' as const },
  { id: 'MH-12-LM-2290', type: 'Mini Truck',      driver: 'V. Singh',     status: 'ontrip'    as const },
  { id: 'UP-32-NP-9910', type: 'Tanker',          driver: '—',            status: 'inshop'    as const },
  { id: 'RJ-14-QR-0055', type: 'Box Truck',       driver: 'M. Joshi',     status: 'available' as const },
];

type VehicleStatus = 'ontrip' | 'available' | 'inshop';

const STATUS_CYCLES: Record<string, VehicleStatus[]> = {
  'MH-04-AB-1123': ['ontrip', 'ontrip', 'ontrip', 'available'],
  'KA-09-CD-4471': ['available', 'ontrip', 'available', 'available'],
  'DL-01-EF-8820': ['ontrip', 'ontrip', 'available', 'ontrip'],
  'TN-22-GH-3302': ['inshop', 'inshop', 'available', 'inshop'],
  'GJ-05-JK-7714': ['available', 'available', 'ontrip', 'available'],
  'MH-12-LM-2290': ['ontrip', 'available', 'ontrip', 'ontrip'],
  'UP-32-NP-9910': ['inshop', 'available', 'inshop', 'inshop'],
  'RJ-14-QR-0055': ['available', 'ontrip', 'available', 'available'],
};

const STATUS_LABEL: Record<VehicleStatus, string> = {
  ontrip:    'On Trip',
  available: 'Available',
  inshop:    'In Shop',
};

const STATUS_CLASS: Record<VehicleStatus, string> = {
  ontrip:    'status-badge status-badge--amber',
  available: 'status-badge status-badge--green',
  inshop:    'status-badge status-badge--slate',
};

const TILE_CLASS: Record<VehicleStatus, string> = {
  ontrip:    'vehicle-tile vehicle-tile--ontrip',
  available: 'vehicle-tile vehicle-tile--available',
  inshop:    'vehicle-tile vehicle-tile--inshop',
};

// ─── Clock Component ───────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-IN', { hour12: false }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="telemetry text-[#8993A4] text-sm">{time}</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [fleet, setFleet] = useState(FLEET_INITIAL);
  const [tick, setTick] = useState(0);

  // Cycle fleet statuses every 3s to simulate live ops wall
  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => (t + 1) % 4);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setFleet(prev =>
      prev.map(v => ({
        ...v,
        status: STATUS_CYCLES[v.id][tick],
      }))
    );
  }, [tick]);

  const onTrip    = fleet.filter(v => v.status === 'ontrip').length;
  const available = fleet.filter(v => v.status === 'available').length;
  const inShop    = fleet.filter(v => v.status === 'inshop').length;

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh', color: 'var(--color-text-primary)' }}>

      {/* ── NAV ───────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-base)' }}
           className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ background: 'var(--color-signal-amber)', color: '#0D1117' }}
                 className="h-8 w-8 rounded flex items-center justify-center font-bold text-sm font-display">
              TO
            </div>
            <span className="font-display font-semibold text-base tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}>
              TransitOps
            </span>
          </div>
          <div className="flex items-center gap-4">
            <LiveClock />
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

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-8">

        {/* Fleet summary bar */}
        <div className="flex items-center gap-6 mb-6"
             style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
          <span className="telemetry text-xs" style={{ color: 'var(--color-text-muted)' }}>
            FLEET OPERATIONS BOARD
          </span>
          <div className="flex items-center gap-5 ml-auto">
            <span className="flex items-center gap-1.5 telemetry text-xs">
              <span style={{ color: 'var(--color-signal-amber)' }}>■</span>
              <span style={{ color: 'var(--color-text-muted)' }}>On Trip</span>
              <span style={{ color: 'var(--color-signal-amber)', fontWeight: 600 }}>{onTrip}</span>
            </span>
            <span className="flex items-center gap-1.5 telemetry text-xs">
              <span style={{ color: 'var(--color-signal-green)' }}>■</span>
              <span style={{ color: 'var(--color-text-muted)' }}>Available</span>
              <span style={{ color: 'var(--color-signal-green)', fontWeight: 600 }}>{available}</span>
            </span>
            <span className="flex items-center gap-1.5 telemetry text-xs">
              <span style={{ color: '#4A5568' }}>■</span>
              <span style={{ color: 'var(--color-text-muted)' }}>In Shop</span>
              <span style={{ color: '#8993A4', fontWeight: 600 }}>{inShop}</span>
            </span>
          </div>
        </div>

        {/* Live fleet grid — the signature element */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
          {fleet.map(v => (
            <div key={v.id} className={TILE_CLASS[v.status]}>
              <div className="flex items-start justify-between gap-2">
                <span className="vehicle-tile__reg">{v.id}</span>
                <span className={STATUS_CLASS[v.status]}>{STATUS_LABEL[v.status]}</span>
              </div>
              <div>
                <div className="vehicle-tile__type">{v.type}</div>
                {v.driver !== '—' && (
                  <div className="telemetry text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {v.driver}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Headline */}
        <div className="max-w-3xl">
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[56px] leading-tight"
              style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
            Stop running your fleet
            <br />
            <span style={{ color: 'var(--color-signal-amber)' }}>from a spreadsheet.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg" style={{ color: 'var(--color-text-muted)', fontFamily: "'IBM Plex Sans'" }}>
            TransitOps enforces the rules you currently enforce manually — blocked dispatches on expired licenses,
            cargo weight limits before a vehicle leaves the yard, live odometer entries per run.
            The operations board above is live. So is yours when you sign in.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="btn-primary">
              Access Console →
            </Link>
            <Link href="/login" className="btn-ghost">
              Register your company
            </Link>
          </div>
        </div>
      </section>

      {/* ── PROBLEMS ──────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--color-border)' }} className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="telemetry text-xs mb-8" style={{ color: 'var(--color-text-muted)' }}>
            WHAT BREAKS WITHOUT ENFORCEMENT
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px"
               style={{ background: 'var(--color-border)' }}>

            {[
              {
                tag: '01 / DOUBLE BOOKING',
                title: 'Same truck. Two dispatches.',
                body: 'A vehicle assigned to Route A gets manually scheduled for Route B two hours later. The spreadsheet doesn\'t check. The yard finds out when the driver doesn\'t show.',
              },
              {
                tag: '02 / EXPIRED LICENSE',
                title: 'Driver dispatched. License expired yesterday.',
                body: 'A commercial license expires. No one flags it. The driver is assigned to a 400 km run. The violation shows up after an accident or a checkpoint stop.',
              },
              {
                tag: '03 / GHOST ODOMETER',
                title: 'Fuel logs without mileage.',
                body: 'Fuel refills get logged. Actual trip distances don\'t. Fuel efficiency numbers become meaningless. Maintenance intervals drift. Nobody knows until a breakdown.',
              },
            ].map(p => (
              <div key={p.tag} className="p-8"
                   style={{ background: 'var(--color-surface)' }}>
                <div className="telemetry text-xs mb-4" style={{ color: 'var(--color-signal-amber)' }}>
                  {p.tag}
                </div>
                <h3 className="font-display font-semibold text-lg mb-3"
                    style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>
                  {p.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ─────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--color-border)' }} className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="telemetry text-xs mb-10" style={{ color: 'var(--color-text-muted)' }}>
            YOUR CONSOLE, BY ROLE
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                role: 'Fleet Manager',
                signal: 'var(--color-signal-amber)',
                stops: [
                  'Chasing drivers to confirm dispatch',
                  'Manually checking vehicle capacity before every run',
                  'Cross-referencing availability across different sheets',
                ],
                gets: 'One screen showing every asset status, with dispatch blocked automatically when rules aren\'t met.',
              },
              {
                role: 'Driver',
                signal: 'var(--color-signal-green)',
                stops: [
                  'Getting last-minute trip changes with no trail',
                  'Submitting odometer photos via WhatsApp',
                  'Wondering what happens after completing a route',
                ],
                gets: 'A terminal showing your current assignment, dispatch controls, and a direct upload for your credentials and trip documents.',
              },
              {
                role: 'Safety Officer',
                signal: '#3B82F6',
                stops: [
                  'Manually scanning license expiry dates every week',
                  'Finding out a driver\'s medical clearance lapsed after dispatch',
                  'Building compliance spreadsheets from scratch every quarter',
                ],
                gets: 'A live ledger of every driver\'s license status and safety score, with expiry alerts flagged 30 days ahead.',
              },
              {
                role: 'Financial Analyst',
                signal: '#A78BFA',
                stops: [
                  'Requesting fuel and maintenance data from ops',
                  'Reconciling trip distances with fuel receipts by hand',
                  'Estimating fleet ROI without per-vehicle cost breakdowns',
                ],
                gets: 'A live P&L board: per-vehicle acquisition, fuel, and maintenance cost vs. estimated revenue. One CSV export.',
              },
            ].map(r => (
              <div key={r.role} className="ops-panel p-6">
                <div className="flex items-center gap-3 mb-5">
                  <span className="h-2 w-2 rounded-full" style={{ background: r.signal }} />
                  <span className="font-display font-semibold text-base"
                        style={{ color: 'var(--color-text-primary)' }}>
                    {r.role}
                  </span>
                </div>

                <p className="text-xs mb-3 telemetry" style={{ color: 'var(--color-text-muted)' }}>
                  STOPS WORRYING ABOUT
                </p>
                <ul className="space-y-2 mb-5">
                  {r.stops.map(s => (
                    <li key={s} className="flex items-start gap-2 text-sm"
                        style={{ color: 'var(--color-text-muted)' }}>
                      <span style={{ color: 'var(--color-signal-red)', marginTop: '2px' }}>✕</span>
                      {s}
                    </li>
                  ))}
                </ul>

                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                  <p className="text-xs mb-2 telemetry" style={{ color: 'var(--color-text-muted)' }}>
                    GETS INSTEAD
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                    {r.gets}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ───────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--color-border)' }} className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <p className="telemetry text-xs mb-10" style={{ color: 'var(--color-text-muted)' }}>
            ENFORCED TRIP LIFECYCLE
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px"
               style={{ background: 'var(--color-border)' }}>
            {[
              {
                step: '01',
                label: 'DRAFT',
                color: 'var(--color-text-muted)',
                rules: [
                  'Vehicle must be in AVAILABLE status',
                  'Driver must be in AVAILABLE status',
                  'Cargo weight must not exceed vehicle\'s max load capacity',
                ],
              },
              {
                step: '02',
                label: 'DISPATCHED',
                color: 'var(--color-signal-amber)',
                rules: [
                  'Vehicle and driver status set to ON_TRIP immediately',
                  'Driver\'s license must not be expired at dispatch time',
                  'Neither vehicle nor driver can be re-assigned mid-trip',
                ],
              },
              {
                step: '03a',
                label: 'COMPLETED',
                color: 'var(--color-signal-green)',
                rules: [
                  'Actual distance and fuel consumed are required — no blanks',
                  'Vehicle odometer is incremented by actual distance',
                  'Vehicle and driver status revert to AVAILABLE',
                ],
              },
              {
                step: '03b',
                label: 'CANCELLED',
                color: 'var(--color-signal-red)',
                rules: [
                  'Available from DRAFT or DISPATCHED state only',
                  'Vehicle and driver status revert to AVAILABLE',
                  'Trip record is preserved for audit trail',
                ],
              },
            ].map(s => (
              <div key={s.step} style={{ background: 'var(--color-surface)' }} className="p-7">
                <div className="flex items-center gap-3 mb-5">
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
                  {s.rules.map(r => (
                    <li key={r} className="text-sm leading-relaxed"
                        style={{ color: 'var(--color-text-muted)' }}>
                      — {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section style={{ borderTop: '1px solid var(--color-border)' }} className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="ops-panel p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl"
                  style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                Register your company. Start dispatch today.
              </h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                One admin account. One Tenant ID. Your entire fleet, visible from one screen.
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-3 shrink-0">
              <Link href="/login" className="btn-primary">
                Create Tenant Account →
              </Link>
              <Link href="/login"
                    className="text-xs telemetry text-center"
                    style={{ color: 'var(--color-text-muted)' }}>
                Already registered? Sign in →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--color-border)' }}
              className="py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div style={{ background: 'var(--color-signal-amber)', color: '#0D1117' }}
                 className="h-6 w-6 rounded flex items-center justify-center font-bold text-xs font-display">
              TO
            </div>
            <span className="font-display font-semibold text-sm"
                  style={{ color: 'var(--color-text-muted)' }}>
              TransitOps
            </span>
          </div>
          <div className="telemetry text-xs" style={{ color: 'var(--color-text-muted)' }}>
            © 2026 TransitOps, Inc. Fleet operations software.
          </div>
        </div>
      </footer>

    </div>
  );
}
