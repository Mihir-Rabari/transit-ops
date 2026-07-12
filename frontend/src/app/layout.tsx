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
  Moon, 
  Sun,
  Menu,
  X,
  UserCog
} from 'lucide-react';
import './globals.css';

function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync dark mode class
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.classList.toggle('dark', savedTheme === 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.body.classList.toggle('dark', nextTheme === 'dark');
  };

  // Protect all pages except login
  useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-dark-bg text-brand-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  // If login page, render full screen without layout elements
  if (pathname === '/login' || !user) {
    return <div className="min-h-screen bg-slate-50 dark:bg-dark-bg transition-colors duration-200">{children}</div>;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'User Management', path: '/users', icon: UserCog, roles: ['ADMIN'] },
    { name: 'Vehicles', path: '/vehicles', icon: Truck, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'Drivers', path: '/drivers', icon: Users, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'Trips', path: '/trips', icon: Route, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'Maintenance', path: '/maintenance', icon: Wrench, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'Fuel & Expenses', path: '/fuel-expenses', icon: Fuel, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'FLEET_MANAGER', 'DRIVER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-dark-bg font-sans transition-colors duration-200">
      
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white p-5 dark:border-dark-border dark:bg-dark-card transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center justify-between pb-6">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold shadow-md shadow-brand-500/20">
                  TO
                </div>
                <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
                  Transit<span className="text-brand-500">Ops</span>
                </span>
              </div>
              <button className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white" onClick={() => setSidebarOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {allowedMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      router.push(item.path);
                      setSidebarOpen(false);
                    }}
                    className={`flex w-full items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 ${
                      isActive 
                        ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400' 
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-dark-muted dark:hover:bg-slate-800/40 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile / Logout */}
          <div className="border-t border-slate-100 pt-4 dark:border-dark-border">
            <div className="mb-4 flex items-center space-x-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/30">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="truncate text-xs text-slate-400 dark:text-dark-muted capitalize">{user.role.replace('_', ' ').toLowerCase()}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex w-full items-center space-x-3 rounded-lg px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut size={18} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-dark-border dark:bg-dark-card transition-colors duration-200">
          <div className="flex items-center space-x-3">
            <button className="lg:hidden text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-semibold capitalize text-slate-800 dark:text-white">
              {pathname.substring(1).replace('-', ' ') || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-dark-border dark:text-slate-400 dark:hover:bg-slate-800 transition-all"
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <title>TransitOps - Smart Transport Operations</title>
        <meta name="description" content="TransitOps Fleet management panel" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚚</text></svg>" />
      </head>
      <body className="h-full">
        <AuthProvider>
          <MainLayout>{children}</MainLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
