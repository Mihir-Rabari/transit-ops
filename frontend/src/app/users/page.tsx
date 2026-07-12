'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  ShieldAlert, 
  X, 
  UserPlus, 
  Shield, 
  Trash2, 
  Edit3,
  UserCheck,
  Mail,
  Lock,
  UserCog
} from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
  createdAt: string;
  driver: {
    id: string;
    name: string;
    licenseNumber: string;
  } | null;
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Add User Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('DRIVER');
  const [driverId, setDriverId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST'>('DRIVER');
  const [editDriverId, setEditDriverId] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Protect client side
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const fetchUsersAndDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, driversData] = await Promise.all([
        apiRequest('/users'),
        apiRequest('/drivers')
      ]);
      setUsersList(usersData);
      setDrivers(driversData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchUsersAndDrivers();
    }
  }, [user, fetchUsersAndDrivers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !email || !password || !role) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          driverId: role === 'DRIVER' ? driverId || null : null
        })
      });

      // Reset Form and reload
      setName('');
      setEmail('');
      setPassword('');
      setRole('DRIVER');
      setDriverId('');
      setShowAddForm(false);
      fetchUsersAndDrivers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError(null);

    if (!editingUser) return;
    if (!editName || !editRole) {
      setEditFormError('Name and Role are required');
      return;
    }

    try {
      await apiRequest(`/users/${editingUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName,
          role: editRole,
          driverId: editRole === 'DRIVER' ? editDriverId || null : null,
          password: editPassword || null
        })
      });

      setEditingUser(null);
      setEditPassword('');
      fetchUsersAndDrivers();
    } catch (err: any) {
      setEditFormError(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (user?.id === userId) {
      alert('You cannot delete your own logged-in account.');
      return;
    }
    if (!confirm('Are you sure you want to permanently delete this user account?')) return;

    try {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' });
      fetchUsersAndDrivers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const openEditModal = (u: UserRecord) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditRole(u.role);
    setEditDriverId(u.driver?.id || '');
    setEditFormError(null);
  };

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (roleName: string) => {
    switch (roleName) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200/50';
      case 'FLEET_MANAGER':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50';
      case 'DRIVER':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50';
      case 'SAFETY_OFFICER':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50';
      case 'FINANCIAL_ANALYST':
        return 'status-badge status-badge--slate';
      default:
        return 'status-badge status-badge--slate';
    }
  };

  if (user?.role !== 'ADMIN') {
    return null; // Don't flash layout content
  }

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>User Administration</h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Manage system authentication profiles, roles, and driver links.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Create User</span>
        </button>
      </div>

      {/* Add User Form Panel */}
      {showAddForm && (
        <div className="ops-panel p-5 animate-fadeIn">
          <div className="mb-4 flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Create New User Account</h3>
            <button onClick={() => setShowAddForm(false)} className="hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded bg-red-50 p-3 text-xs font-semibold text-red-500">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Samuel L. Jackson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. sam@transitops.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Initial Password *</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Role Type *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <option value="ADMIN">Administrator</option>
                <option value="FLEET_MANAGER">Fleet Manager</option>
                <option value="DRIVER">Driver</option>
                <option value="SAFETY_OFFICER">Safety Officer</option>
                <option value="FINANCIAL_ANALYST">Financial Analyst</option>
              </select>
            </div>

            {role === 'DRIVER' && (
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Link Driver Profile</label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <option value="">-- No Profile Association --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-end sm:col-span-2 md:col-span-3">
              <button
                type="submit"
                className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Directory Filter Panel */}
      <div className="ops-panel flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--color-text-muted)' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border py-2 pl-10 pr-4 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase" style={{ color: 'var(--color-text-muted)' }}>Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border px-3 py-1.5 text-sm focus:outline-none" style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Administrator</option>
            <option value="FLEET_MANAGER">Fleet Manager</option>
            <option value="DRIVER">Driver</option>
            <option value="SAFETY_OFFICER">Safety Officer</option>
            <option value="FINANCIAL_ANALYST">Financial Analyst</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-r-transparent" style={{ borderColor: 'var(--color-signal-amber)' }} />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="ops-panel p-8 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 mb-3" style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
          <h3 className="text-md font-bold" style={{ color: 'var(--color-text-muted)' }}>No users found</h3>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>Verify your filters or search constraints.</p>
        </div>
      ) : (
        <div className="overflow-x-auto ops-panel">
          <table className="min-w-full divide-y divide-[var(--color-border)] text-left text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wider" style={{ background: 'rgba(35,43,55,0.4)', color: 'var(--color-text-muted)' }}>
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">System Role</th>
                <th className="px-6 py-4">Linked Driver Profile</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-[var(--color-surface-raised)]">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full font-semibold" style={{ background: 'rgba(255,176,32,0.12)', color: 'var(--color-signal-amber)' }}>
                        {u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{u.name}</p>
                        <p className="text-xs flex items-center" style={{ color: 'var(--color-text-muted)' }}>
                          <Mail size={12} className="mr-1" style={{ color: 'var(--color-text-muted)' }} />
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeClass(u.role)}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.driver ? (
                      <span className="inline-flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <UserCheck size={14} className="mr-1" />
                        {u.driver.name} ({u.driver.licenseNumber})
                      </span>
                    ) : u.role === 'DRIVER' ? (
                      <span className="inline-flex items-center text-xs text-amber-500 font-medium">
                        <ShieldAlert size={14} className="mr-1" />
                        Unlinked Driver
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)] text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center space-x-3">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-[var(--color-text-muted)] hover:text-[var(--color-signal-amber)] dark:hover:text-brand-400 transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={user?.id === u.id}
                        className="text-[var(--color-text-muted)] hover:text-red-500 disabled:opacity-30 disabled:hover:text-[var(--color-text-muted)] transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md ops-panel p-6">
            
            <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>Edit User Profile</h3>
                <p className="text-xs text-[var(--color-text-muted)] dark:text-dark-muted font-mono">{editingUser.email}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {editFormError && (
              <div className="mb-4 rounded bg-red-50 p-3 text-xs font-semibold text-red-500">
                {editFormError}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none"
                  style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>System Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none"
                  style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="FLEET_MANAGER">Fleet Manager</option>
                  <option value="DRIVER">Driver</option>
                  <option value="SAFETY_OFFICER">Safety Officer</option>
                  <option value="FINANCIAL_ANALYST">Financial Analyst</option>
                </select>
              </div>

              {editRole === 'DRIVER' && (
                <div>
                  <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>Link Driver Profile</label>
                  <select
                    value={editDriverId}
                    onChange={(e) => setEditDriverId(e.target.value)}
                    className="w-full rounded-md border px-3 py-2.5 text-sm focus:outline-none"
                    style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  >
                    <option value="">-- No Profile Association --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.licenseNumber})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Change Password (leave empty to keep current)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3" style={{ color: 'var(--color-text-muted)' }}>
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full rounded-md border py-2.5 pl-10 pr-4 text-sm focus:outline-none"
                    style={{ background: 'var(--color-base)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-sm"
              >
                Save User Profile
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
