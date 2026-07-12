import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserPlus, Shield, ToggleLeft, ToggleRight, Unlock, Edit, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import AddUserDrawer from './AddUserDrawer';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
}

const API_BASE_URL = 'http://localhost:8000/api/v1';

const DEFAULT_MOCK_USERS: User[] = [
  { id: '1', email: 'admin@transitops.com', fullName: 'System Admin', role: 'admin', isActive: true, phone: '+91 90000 11111', lastLogin: '2026-07-12T14:30:00' },
  { id: '2', email: 'fleet.manager@transitops.in', fullName: 'Fleet Manager', role: 'fleet_manager', isActive: true, phone: '+91 98400 12345', lastLogin: '2026-07-12T15:02:00' },
  { id: '3', email: 'driver@transitops.in', fullName: 'Alex Kumar', role: 'driver', isActive: true, phone: '+91 94450 67890', lastLogin: '2026-07-11T18:15:00' },
  { id: '4', email: 'finance@transitops.in', fullName: 'Finance Analyst', role: 'financial_analyst', isActive: true, phone: '+91 87654 32109', lastLogin: '2026-07-12T12:00:00' },
  { id: '5', email: 'safety@transitops.in', fullName: 'Safety Officer', role: 'safety_officer', isActive: true, phone: '+91 99001 45678', lastLogin: '2026-07-12T09:45:00' },
];

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [isUsingMock, setIsUsingMock] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('transitops_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('transitops_token');

    if (token === 'mock-token') {
      const cached = localStorage.getItem('transitops_mock_users');
      if (cached) {
        setUsers(JSON.parse(cached));
      } else {
        setUsers(DEFAULT_MOCK_USERS);
        localStorage.setItem('transitops_mock_users', JSON.stringify(DEFAULT_MOCK_USERS));
      }
      setIsUsingMock(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users from server');
      }

      const data = await response.json();
      const mappedUsers: User[] = data.map((u: any) => ({
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role,
        phone: u.phone || undefined,
        isActive: u.is_active,
        lastLogin: u.last_login || undefined,
      }));

      setUsers(mappedUsers);
      setIsUsingMock(false);
    } catch (error: any) {
      console.warn('Backend API connection failed, falling back to mock users:', error.message);
      // Fallback to local mock state to keep UI interactive
      const cached = localStorage.getItem('transitops_mock_users');
      if (cached) {
        setUsers(JSON.parse(cached));
      } else {
        setUsers(DEFAULT_MOCK_USERS);
        localStorage.setItem('transitops_mock_users', JSON.stringify(DEFAULT_MOCK_USERS));
      }
      setIsUsingMock(true);
      toast.info('Running in offline/mock mode');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSaveUser = async (userData: any) => {
    if (isUsingMock) {
      // Mock Save
      let nextUsers = [...users];
      if (userData.id) {
        // Edit Mode
        nextUsers = nextUsers.map(u => u.id === userData.id ? {
          ...u,
          fullName: userData.full_name,
          email: userData.email,
          phone: userData.phone || undefined,
          role: userData.role,
          isActive: userData.is_active,
        } : u);
      } else {
        // Add Mode
        const newUser: User = {
          id: Math.random().toString(36).slice(2, 9),
          email: userData.email,
          fullName: userData.full_name,
          role: userData.role,
          phone: userData.phone || undefined,
          isActive: true,
          lastLogin: undefined,
        };
        nextUsers.push(newUser);
      }
      setUsers(nextUsers);
      localStorage.setItem('transitops_mock_users', JSON.stringify(nextUsers));
      return;
    }

    // Call API
    if (userData.id) {
      // Edit User API
      const response = await fetch(`${API_BASE_URL}/auth/users/${userData.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role,
          is_active: userData.is_active,
          ...(userData.password ? { password: userData.password } : {}),
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update user');
      }
    } else {
      // Register User API
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          role: userData.role,
          phone: userData.phone,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to register user');
      }
    }

    await fetchUsers();
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = !user.isActive;

    if (isUsingMock) {
      const nextUsers = users.map(u => u.id === user.id ? { ...u, isActive: nextStatus } : u);
      setUsers(nextUsers);
      localStorage.setItem('transitops_mock_users', JSON.stringify(nextUsers));
      toast.success(`User ${nextStatus ? 'activated' : 'deactivated'}`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/${user.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_active: nextStatus }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update user status');
      }

      toast.success(`User ${nextStatus ? 'activated' : 'deactivated'}`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle user status');
    }
  };

  const handleUnlockUser = async (user: User) => {
    if (isUsingMock) {
      toast.success(`User ${user.fullName} unlocked (mock)`);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/unlock/${user.id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to unlock user');
      }

      toast.success(`User ${user.fullName} unlocked successfully`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to unlock user');
    }
  };

  // Helper to format date
  const formatDateTime = (s?: string): string => {
    if (!s) return 'Never';
    return new Date(s).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper to format role names cleanly
  const formatRole = (role: string): string => {
    const norm = role.toLowerCase();
    if (norm === 'fleet_manager') return 'Fleet Manager';
    if (norm === 'driver') return 'Driver';
    if (norm === 'financial_analyst') return 'Financial Analyst';
    if (norm === 'safety_officer') return 'Safety Officer';
    if (norm === 'admin') return 'System Admin';
    return role;
  };

  // Filtering
  const filteredUsers = users.filter(u => {
    const nameMatch = u.fullName.toLowerCase().includes(search.toLowerCase());
    const emailMatch = u.email.toLowerCase().includes(search.toLowerCase());
    const roleMatch = !roleFilter || u.role.toLowerCase() === roleFilter.toLowerCase();
    return (nameMatch || emailMatch) && roleMatch;
  });

  return (
    <div className="space-y-4">
      {isUsingMock && (
        <div className="flex items-center gap-2 text-xs bg-amber-500/5 border border-amber-500/10 text-amber-500 rounded p-3" role="alert">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>Running in mock data mode because the backend server is unreachable. Actions will be simulated locally.</span>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded bg-input-background border border-border text-foreground text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-2 py-1.5 rounded bg-input-background border border-border text-foreground text-[0.8125rem] focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 appearance-none min-w-[140px]"
          >
            <option value="">All Roles</option>
            <option value="fleet_manager">Fleet Manager</option>
            <option value="driver">Driver</option>
            <option value="safety_officer">Safety Officer</option>
            <option value="financial_analyst">Financial Analyst</option>
            <option value="admin">System Admin</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-muted hover:bg-muted/80 text-foreground border border-border transition-all"
            title="Refresh List"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => { setSelectedUser(undefined); setShowDrawer(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm"
          >
            <UserPlus size={13} />
            Register User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-border rounded-md overflow-hidden bg-card">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <RefreshCw size={24} className="animate-spin text-amber-500" />
            <span className="text-xs">Fetching users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-1">
            <span className="text-sm font-semibold">No users found</span>
            <span className="text-xs">Try adjusting your filters or register a new user.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[0.8125rem] text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-2.5">Full Name</th>
                  <th className="px-4 py-2.5">Email Address</th>
                  <th className="px-4 py-2.5 w-36">Role</th>
                  <th className="px-4 py-2.5 w-32">Phone</th>
                  <th className="px-4 py-2.5 w-24">Status</th>
                  <th className="px-4 py-2.5 w-44">Last Active</th>
                  <th className="px-4 py-2.5 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-accent/15 transition-colors">
                    <td className="px-4 py-3 font-semibold text-foreground">{user.fullName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{formatRole(user.role)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        user.isActive
                          ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-500'
                          : 'bg-destructive/5 border-destructive/20 text-destructive'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDateTime(user.lastLogin)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setSelectedUser(user); setShowDrawer(true); }}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit User"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleUnlockUser(user)}
                          className="p-1 rounded text-muted-foreground hover:text-amber-500 hover:bg-muted transition-colors"
                          title="Unlock / Reset Attempts"
                        >
                          <Unlock size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`p-1 rounded transition-colors ${
                            user.isActive
                              ? 'text-emerald-500 hover:text-destructive hover:bg-muted'
                              : 'text-muted-foreground hover:text-emerald-500 hover:bg-muted'
                          }`}
                          title={user.isActive ? 'Deactivate User' : 'Activate User'}
                        >
                          {user.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddUserDrawer
        open={showDrawer}
        onClose={() => { setShowDrawer(false); setSelectedUser(undefined); }}
        onSave={handleSaveUser}
        userToEdit={selectedUser}
      />
    </div>
  );
}
