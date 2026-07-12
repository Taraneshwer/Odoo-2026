export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: 'FLEET_MANAGER' | 'DRIVER' | 'FINANCIAL_ANALYST' | 'SAFETY_OFFICER' | 'ADMIN';
  phone?: string;
  isActive: boolean;
}

export const isMockMode = true; // Set to true so that Demo Access cards are visible in LoginPage.tsx

const API_BASE_URL = 'http://localhost:8000/api/v1';

function mapBackendRoleToFrontend(role: string): AuthenticatedUser['role'] {
  const norm = role.toLowerCase();
  if (norm === 'fleet_manager') return 'FLEET_MANAGER';
  if (norm === 'driver') return 'DRIVER';
  if (norm === 'financial_analyst') return 'FINANCIAL_ANALYST';
  if (norm === 'safety_officer') return 'SAFETY_OFFICER';
  if (norm === 'admin') return 'FLEET_MANAGER'; // Map admin to FLEET_MANAGER to match sidebar/settings privileges
  return 'FLEET_MANAGER';
}

export const authService = {
  async login(email: string, password?: string): Promise<AuthenticatedUser> {
    // If it's a demo account, use mock mode login
    if (email.endsWith('@transitops.in')) {
      let role: AuthenticatedUser['role'] = 'FLEET_MANAGER';
      let fullName = 'Fleet Manager';
      if (email.startsWith('driver')) {
        role = 'DRIVER';
        fullName = 'Alex Kumar';
      } else if (email.startsWith('finance')) {
        role = 'FINANCIAL_ANALYST';
        fullName = 'Finance Analyst';
      } else if (email.startsWith('safety')) {
        role = 'SAFETY_OFFICER';
        fullName = 'Safety Officer';
      }

      const mockUser: AuthenticatedUser = {
        id: `mock-${role.toLowerCase()}`,
        email,
        fullName,
        role,
        isActive: true,
      };

      localStorage.setItem('transitops_token', 'mock-token');
      localStorage.setItem('transitops_user', JSON.stringify(mockUser));
      return mockUser;
    }

    // Otherwise attempt to contact the backend API
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || '' }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ detail: 'Invalid credentials' }));
        throw new Error(errData.detail || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('transitops_token', data.access_token);

      const frontendUser: AuthenticatedUser = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.full_name,
        role: mapBackendRoleToFrontend(data.user.role),
        phone: data.user.phone || undefined,
        isActive: data.user.is_active,
      };

      localStorage.setItem('transitops_user', JSON.stringify(frontendUser));
      return frontendUser;
    } catch (error: any) {
      // Fallback for admin@transitops.com if backend is offline or for local convenience
      if (email === 'admin@transitops.com' && (password === 'admin123' || password === 'transitops2026')) {
        const adminUser: AuthenticatedUser = {
          id: 'admin-id',
          email: 'admin@transitops.com',
          fullName: 'System Admin',
          role: 'FLEET_MANAGER',
          isActive: true,
        };
        localStorage.setItem('transitops_token', 'mock-token');
        localStorage.setItem('transitops_user', JSON.stringify(adminUser));
        return adminUser;
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_user');
  },

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    const token = localStorage.getItem('transitops_token');
    const cachedUserJson = localStorage.getItem('transitops_user');
    if (!token || !cachedUserJson) return null;

    if (token === 'mock-token') {
      return JSON.parse(cachedUserJson);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Session expired');
      }

      const data = await response.json();
      const frontendUser: AuthenticatedUser = {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: mapBackendRoleToFrontend(data.role),
        phone: data.phone || undefined,
        isActive: data.is_active,
      };

      localStorage.setItem('transitops_user', JSON.stringify(frontendUser));
      return frontendUser;
    } catch {
      // Fallback to cache if request fails (e.g. backend is temporarily offline)
      try {
        return JSON.parse(cachedUserJson);
      } catch {
        this.logout();
        return null;
      }
    }
  }
};
