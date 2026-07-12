'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Building, Mail, KeyRound, User as UserIcon, Truck } from 'lucide-react';

export default function LoginPage() {
  const { user, login, register, loading } = useAuth();
  const router = useRouter();

  const [isRegistering, setIsRegistering] = useState(false);
  const [tenantId, setTenantId]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [name, setName]               = useState('');
  const [companyName, setCompanyName] = useState('');

  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const role = user.role;
      if (role === 'ADMIN' || role === 'FLEET_MANAGER')   router.push('/dashboard/manager');
      else if (role === 'DRIVER')                          router.push('/dashboard/driver');
      else if (role === 'SAFETY_OFFICER')                  router.push('/dashboard/safety');
      else if (role === 'FINANCIAL_ANALYST')               router.push('/dashboard/finance');
      else                                                 router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      if (isRegistering) {
        if (!companyName.trim()) throw new Error('Company name is required.');
        const tid = await register(name, email, password, companyName);
        setSuccess(tid); // we'll display it specially
        setTenantId(tid);
        setIsRegistering(false);
        setPassword('');
      } else {
        if (!tenantId.trim()) throw new Error('Tenant ID is required to sign in.');
        await login(tenantId, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--color-base)', color: 'var(--color-signal-amber)' }}
           className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-r-transparent" />
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    background:  'var(--color-surface-raised)',
    border:      '1px solid var(--color-border)',
    color:       'var(--color-text-primary)',
    borderRadius: '6px',
    padding:     '9px 12px 9px 36px',
    fontSize:    '14px',
    fontFamily:  "'IBM Plex Sans', sans-serif",
    width:       '100%',
    outline:     'none',
    transition:  'border-color 120ms ease',
  };

  const labelStyle: React.CSSProperties = {
    display:      'block',
    fontFamily:   "'IBM Plex Mono', monospace",
    fontSize:     '10px',
    fontWeight:   500,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color:        'var(--color-text-muted)',
    marginBottom: '6px',
  };

  return (
    <div style={{ background: 'var(--color-base)', minHeight: '100vh' }}
         className="flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div style={{ background: 'var(--color-signal-amber)', color: '#0D1117' }}
             className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm font-display">
          <Truck size={16} />
        </div>
        <span className="font-display font-semibold text-base"
              style={{ color: 'var(--color-text-primary)' }}>
          TransitOps
        </span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm"
           style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '32px' }}>

        {/* Header */}
        <div className="mb-7">
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>
            {isRegistering ? 'Register company tenant' : 'Operator sign-in'}
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)', fontFamily: "'IBM Plex Sans'" }}>
            {isRegistering
              ? 'Creates a new isolated tenant and admin account.'
              : 'Enter your Tenant ID and credentials to continue.'}
          </p>
        </div>

        {/* Tenant ID success box */}
        {success && (
          <div style={{
            background: 'rgba(62, 207, 142, 0.08)',
            border: '1px solid rgba(62, 207, 142, 0.25)',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '16px',
          }}>
            <p className="telemetry text-[10px] mb-1.5" style={{ color: 'var(--color-signal-green)' }}>
              COMPANY REGISTERED — YOUR TENANT ID
            </p>
            <p className="telemetry text-sm font-medium break-all" style={{ color: 'var(--color-text-primary)' }}>
              {success}
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)', fontFamily: "'IBM Plex Sans'" }}>
              Save this ID — you'll need it every time you sign in. It has been emailed to you.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(255, 92, 92, 0.08)',
            border: '1px solid rgba(255, 92, 92, 0.25)',
            borderRadius: '6px',
            padding: '10px 14px',
            marginBottom: '16px',
          }}>
            <p className="text-xs" style={{ color: 'var(--color-signal-red)', fontFamily: "'IBM Plex Sans'" }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Tenant ID — only on login */}
          {!isRegistering && (
            <div>
              <label style={labelStyle}>Tenant ID</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                  <Building size={14} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="550e8400-e29b-41d4-a716-…"
                  value={tenantId}
                  onChange={e => setTenantId(e.target.value)}
                  style={{ ...inputStyle, fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-signal-amber)')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                />
              </div>
            </div>
          )}

          {/* Company name — only on register */}
          {isRegistering && (
            <div>
              <label style={labelStyle}>Company Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                  <Building size={14} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Acme Fleet Operations"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-signal-amber)')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                />
              </div>
            </div>
          )}

          {/* Admin name — only on register */}
          {isRegistering && (
            <div>
              <label style={labelStyle}>Administrator Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                  <UserIcon size={14} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-signal-amber)')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                <Mail size={14} />
              </span>
              <input
                type="email"
                required
                placeholder="admin@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-signal-amber)')}
                onBlur={e  => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                <KeyRound size={14} />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--color-signal-amber)')}
                onBlur={e  => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full justify-center mt-2"
            style={{ opacity: submitting ? 0.6 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting
              ? 'Please wait…'
              : isRegistering
                ? 'Create Tenant Account'
                : 'Sign In →'}
          </button>
        </form>

        {/* Toggle */}
        <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '20px', paddingTop: '16px' }}
             className="text-center">
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(null); setSuccess(null); }}
            className="text-xs"
            style={{ color: 'var(--color-text-muted)', fontFamily: "'IBM Plex Sans'", textDecoration: 'underline', textUnderlineOffset: '3px' }}
          >
            {isRegistering ? 'Have an account? Sign in' : 'Register a new company tenant'}
          </button>
        </div>

      </div>

      {/* Footer hint */}
      <p className="telemetry text-[11px] mt-8" style={{ color: 'var(--color-text-muted)' }}>
        TransitOps v1.0 · Fleet Operations Platform
      </p>
    </div>
  );
}
