'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardRedirector() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        const role = user.role;
        if (role === 'ADMIN' || role === 'FLEET_MANAGER') {
          router.push('/dashboard/manager');
        } else if (role === 'DRIVER') {
          router.push('/dashboard/driver');
        } else if (role === 'SAFETY_OFFICER') {
          router.push('/dashboard/safety');
        } else if (role === 'FINANCIAL_ANALYST') {
          router.push('/dashboard/finance');
        } else {
          router.push('/login');
        }
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex h-screen items-center justify-center" style={{ background: 'var(--color-base)', color: 'var(--color-signal-amber)' }}>
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
    </div>
  );
}
