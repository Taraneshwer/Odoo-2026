export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export const isMockMode = true;

const DEMO_USERS: Record<string, AuthenticatedUser> = {
  'fleet.manager@transitops.in': { id: 'u1', name: 'Fleet Manager', email: 'fleet.manager@transitops.in', role: 'Fleet Manager' },
  'driver@transitops.in': { id: 'u2', name: 'Driver', email: 'driver@transitops.in', role: 'Driver' },
  'finance@transitops.in': { id: 'u3', name: 'Financial Analyst', email: 'finance@transitops.in', role: 'Financial Analyst' },
  'safety@transitops.in': { id: 'u4', name: 'Safety Officer', email: 'safety@transitops.in', role: 'Safety Officer' },
};

const STORAGE_KEY = 'transitops_user';

export const authService = {
  async login(email: string, password: string): Promise<AuthenticatedUser> {
    if (isMockMode) {
      const lower = email.trim().toLowerCase();
      const user = DEMO_USERS[lower];
      if (!user) throw new Error('INVALID_CREDENTIALS');
      // accept any password in mock mode
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      return user;
    }

    // Fallback: try hitting configured API (minimal implementation)
    const base = (import.meta.env.VITE_API_BASE_URL as string) || '';
    if (!base) throw new Error('NO_API_CONFIGURED');

    const res = await fetch(`${base.replace(/\/$/, '')}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('INVALID_CREDENTIALS');
    const data = await res.json();
    const user: AuthenticatedUser = { id: data.id, name: data.name, email: data.email, role: data.role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    return Promise.resolve();
  },

  async getCurrentUser(): Promise<AuthenticatedUser | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthenticatedUser;
    } catch {
      return null;
    }
  },
};

export default authService;
