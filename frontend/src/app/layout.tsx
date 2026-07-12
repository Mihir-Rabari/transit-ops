'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Route, 
  Wrench, 
  Fuel, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  UserCog
} from 'lucide-react';
import './globals.css';

function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Force dark-class on body at all times — this app is always dark
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.style.background = 'var(--color-base)';
  }, []);

  // Protect all pages except login and landing page
  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div style={{ background: 'var(--color-base)', color: 'var(--color-signal-amber)' }}
           className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  // Landing page + login: render bare, no sidebar
  if (pathname === '/login' || pathname === '/' || !user) {
    return <>{children}</>;
  }

  const menuItems = [
    { name: 'Dashboard',      path: '/dashboard',      icon: LayoutDashboard, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'User Management', path: '/users',          icon: UserCog,         roles: ['ADMIN'] },
    { name: 'Vehicles',       path: '/vehicles',        icon: Truck,           roles: ['ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'Drivers',        path: '/drivers',         icon: Users,           roles: ['ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'] },
    { name: 'Trips',          path: '/trips',           icon: Route,           roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'Maintenance',    path: '/maintenance',     icon: Wrench,          roles: ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
    { name: 'Fuel & Expenses', path: '/fuel-expenses',  icon: Fuel,            roles: ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
    { name: 'Reports',        path: '/reports',         icon: BarChart3,       roles: ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  // Derive page title from pathname
  const pageTitle = pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden"
         style={{ background: 'var(--color-base)' }}>

      {/* ── Mobile overlay ─────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden"
             onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 flex flex-col justify-between
        lg:static lg:translate-x-0
        transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}>

        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 h-14"
               style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded flex items-center justify-center font-bold text-xs font-display"
                   style={{ background: 'var(--color-signal-amber)', color: '#0D1117' }}>
                TO
              </div>
              <span className="font-display font-semibold text-sm tracking-tight"
                    style={{ color: 'var(--color-text-primary)' }}>
                TransitOps
              </span>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}
                    style={{ color: 'var(--color-text-muted)' }}>
              <X size={18} />
            </button>
          </div>

          {/* Tenant badge */}
          <div className="px-5 pt-4 pb-3">
            <p className="telemetry text-[10px]" style={{ color: 'var(--color-text-muted)' }}>TENANT</p>
            <p className="telemetry text-xs mt-0.5 truncate" style={{ color: 'var(--color-signal-amber)' }}>
              {user.companyId?.substring(0, 16)}…
            </p>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 pb-4 space-y-0.5">
            {allowedMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => { router.push(item.path); setSidebarOpen(false); }}
                  className="flex w-full items-center gap-3 px-3 py-2 rounded text-sm transition-colors duration-100"
                  style={{
                    background: isActive ? 'var(--color-surface-raised)' : 'transparent',
                    color: isActive ? 'var(--color-signal-amber)' : 'var(--color-text-muted)',
                    borderLeft: isActive ? '2px solid var(--color-signal-amber)' : '2px solid transparent',
                    fontFamily: "'IBM Plex Sans'",
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User / Logout footer */}
        <div className="px-3 pb-4" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded mb-1"
               style={{ background: 'var(--color-surface-raised)' }}>
            <div className="h-7 w-7 rounded flex items-center justify-center font-semibold text-xs font-mono shrink-0"
                 style={{ background: 'var(--color-border)', color: 'var(--color-text-primary)' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="truncate text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {user.name}
              </p>
              <p className="truncate telemetry text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                {user.role.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded text-sm transition-colors"
            style={{ color: 'var(--color-signal-red)', fontFamily: "'IBM Plex Sans'" }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,92,92,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={15} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Panel ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between px-6"
                style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}
                    style={{ color: 'var(--color-text-muted)' }}>
              <Menu size={20} />
            </button>
            <h1 className="font-display font-semibold capitalize text-base tracking-tight"
                style={{ color: 'var(--color-text-primary)' }}>
              {pageTitle}
            </h1>
          </div>

          {/* Right: role badge */}
          <span className="status-badge status-badge--amber hidden sm:inline-flex">
            {user.role.replace(/_/g, ' ')}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <title>TransitOps — Fleet Operations Console</title>
        <meta name="description" content="TransitOps: real-time fleet dispatch, compliance enforcement, and financial intelligence for logistics operations." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚛</text></svg>" />
      </head>
      <body className="h-full">
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
