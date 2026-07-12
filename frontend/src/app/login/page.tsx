'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, Mail, User as UserIcon, HelpCircle } from 'lucide-react';

export default function LoginPage() {
  const { user, login, register, loading } = useAuth();
  const router = useRouter();

  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('FLEET_MANAGER');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (isRegistering) {
        await register(name, email, password, role);
        setSuccess('Account registered successfully! You can now log in.');
        setIsRegistering(false);
        setPassword('');
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-dark-bg text-brand-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-dark-bg transition-colors duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-dark-card border border-slate-100 dark:border-dark-border">
        
        {/* Header */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-bold shadow-lg shadow-brand-500/20 text-xl">
            TO
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            {isRegistering ? 'Create your account' : 'Sign in to TransitOps'}
          </h2>
          <p className="mt-1 text-sm text-slate-400 dark:text-dark-muted">
            {isRegistering ? 'Join the transport operations system' : 'Enter your credentials to continue'}
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-500 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <UserIcon size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white dark:focus:border-brand-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white dark:focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted mb-1">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <KeyRound size={16} />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white dark:focus:border-brand-500"
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-dark-muted mb-1">
                System Role
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Shield size={16} />
                </span>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:border-brand-500 focus:bg-white focus:outline-none dark:border-dark-border dark:bg-slate-900 dark:text-white dark:focus:border-brand-500 appearance-none"
                >
                  <option value="FLEET_MANAGER">Fleet Manager (Full Access)</option>
                  <option value="DRIVER">Driver (Trip Executions)</option>
                  <option value="SAFETY_OFFICER">Safety Officer (Compliance & Safety)</option>
                  <option value="FINANCIAL_ANALYST">Financial Analyst (Read-Only Reports)</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:bg-brand-400 disabled:cursor-not-allowed transition-all shadow-md shadow-brand-600/10"
          >
            {submitting ? 'Please wait...' : isRegistering ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        {/* Register/Login toggles */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setSuccess(null);
            }}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>

        {/* Empty database help message */}
        <div className="mt-8 flex items-start space-x-2 rounded-lg bg-blue-50/50 p-3 text-xs text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/10">
          <HelpCircle size={16} className="mt-0.5 shrink-0" />
          <p>
            <strong>First time setup?</strong> The database is completely empty. Toggle <strong>Register</strong> above to create the initial <strong>Fleet Manager</strong> user.
          </p>
        </div>

      </div>
    </div>
  );
}
