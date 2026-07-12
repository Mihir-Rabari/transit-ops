'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, setTokens, clearTokens } from '../utils/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load user on client startup
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          clearTokens();
        }
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setTokens(data.accessToken, data.refreshToken);
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err: any) {
      throw new Error(err.message || 'Login failed');
    }
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('API logout failed, clearing tokens locally');
    } finally {
      clearTokens();
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
