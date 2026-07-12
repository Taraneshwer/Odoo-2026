import React, {
  useState, useReducer, useCallback, useMemo, createContext,
  useContext, useEffect, useRef, type ReactNode,
} from 'react';
import {
  LayoutDashboard, Truck, Users, Wrench, Droplets,
  BarChart3, Settings, ChevronLeft, ChevronRight, Search, Bell,
  Menu, X, Plus, Check, AlertTriangle, ArrowRight, ArrowLeft,
  MoreHorizontal, CheckCircle2, XCircle, Loader2, Info,
  AlertCircle, Download, RefreshCw, Pencil, Trash2,
  ChevronDown, DollarSign, CalendarDays,
  Minus, Activity, TrendingUp, Car, Clock, Route,
  Shield, MapPin, Package, Fuel, Navigation, Sun, Moon, Sparkles,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import UsersTab from './settings/UsersTab';
import BrandLogo from './components/ui/BrandLogo';
import { SmartDispatchPanel } from './components/SmartDispatchPanel';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import AuthLoginPage from './components/auth/LoginPage';
import { authService, type AuthenticatedUser, isMockMode } from '../services/authService';
import { getSmartDispatchRecommendations, type SmartDispatchInput, type SmartDispatchResponse } from '../services/smartDispatchService';
import { DisruptionPanel } from '../features/autorescue/DisruptionPanel';
import { AutoRescuePlanPage } from '../features/autorescue/AutoRescuePlanPage';
import { RecoveryHistory } from '../features/autorescue/RecoveryHistory';
import { detectImpactedTrips } from '../features/autorescue/autorescue.service';
import type { DisruptionEvent, RecoveryHistoryEntry } from '../features/autorescue/autorescue.types';

// ============================================================
// UTILITIES
// ============================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TODAY = '2026-07-12';

function formatCurrency(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function formatCurrencyFull(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

function formatDate(s: string): string {
  return new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(s: string): string {
  return new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function daysUntil(dateStr: string): number {
  const today = new Date(TODAY);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function isExpired(dateStr: string): boolean { return daysUntil(dateStr) < 0; }
function isNearExpiry(dateStr: string): boolean { const d = daysUntil(dateStr); return d >= 0 && d <= 30; }

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function normalizeRole(role?: string): string {
  const value = (role || '').trim().toUpperCase().replace(/\s+/g, '_');
  switch (value) {
    case 'FLEET_MANAGER':
    case 'FLEET_MANAGERS':
      return 'FLEET_MANAGER';
    case 'DRIVER':
      return 'DRIVER';
    case 'FINANCIAL_ANALYST':
    case 'FINANCE':
      return 'FINANCIAL_ANALYST';
    case 'SAFETY_OFFICER':
    case 'SAFETY':
      return 'SAFETY_OFFICER';
    default:
      return value;
  }
}

function getDisplayName(user: AuthenticatedUser | null): string {
  return user?.fullName || user?.name || 'User';
}

// ============================================================
// TYPES
// ============================================================

type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
type MaintenanceStatus = 'ACTIVE' | 'CLOSED';
type ExpenseCategory = 'Toll' | 'Maintenance' | 'Other';

interface Vehicle {
  id: string; registrationNumber: string; name: string; type: string;
  maxLoadCapacity: number; odometer: number; acquisitionCost: number; status: VehicleStatus;
}

interface Driver {
  id: string; name: string; licenseNumber: string; licenseCategory: string;
  licenseExpiryDate: string; contactNumber: string; safetyScore: number; status: DriverStatus;
}

interface Trip {
  id: string; source: string; destination: string; vehicleId: string; driverId: string;
  cargoWeight: number; plannedDistance: number; status: TripStatus;
  createdAt: string; dispatchedAt?: string; completedAt?: string;
}

interface MaintenanceRecord {
  id: string; vehicleId: string; type: string; description: string;
  cost: number; startDate: string; closedDate?: string; status: MaintenanceStatus;
}

interface FuelLog {
  id: string; vehicleId: string; liters: number; cost: number;
  date: string; odometer: number; efficiency: number;
}

interface Expense {
  id: string; vehicleId: string; category: ExpenseCategory; description: string;
  amount: number; date: string;
}

interface AppState {
  vehicles: Vehicle[]; drivers: Driver[]; trips: Trip[];
  maintenance: MaintenanceRecord[]; fuelLogs: FuelLog[]; expenses: Expense[];
}

type AppAction =
  | { type: 'ADD_VEHICLE'; vehicle: Vehicle }
  | { type: 'UPDATE_VEHICLE_STATUS'; vehicleId: string; status: VehicleStatus }
  | { type: 'ADD_DRIVER'; driver: Driver }
  | { type: 'UPDATE_DRIVER'; driverId: string; updates: Partial<Driver> }
  | { type: 'DISPATCH_TRIP'; trip: Trip }
  | { type: 'APPLY_RECOVERY_ASSIGNMENTS'; assignments: Array<{ tripId: string; vehicleId: string; driverId: string }> }
  | { type: 'COMPLETE_TRIP'; tripId: string; vehicleId: string; driverId: string }
  | { type: 'CANCEL_TRIP'; tripId: string; vehicleId: string; driverId: string }
  | { type: 'CREATE_MAINTENANCE'; record: MaintenanceRecord }
  | { type: 'CLOSE_MAINTENANCE'; maintenanceId: string; vehicleId: string }
  | { type: 'ADD_FUEL_LOG'; log: FuelLog }
  | { type: 'ADD_EXPENSE'; expense: Expense };

// ============================================================
// MOCK DATA
// ============================================================

const INIT_VEHICLES: Vehicle[] = [
  { id: 'v1', registrationNumber: 'TN01AB1234', name: 'Van-05', type: 'Van', maxLoadCapacity: 500, odometer: 84230, acquisitionCost: 850000, status: 'AVAILABLE' },
  { id: 'v2', registrationNumber: 'TN09CD8821', name: 'Truck-12', type: 'Heavy Truck', maxLoadCapacity: 5000, odometer: 142560, acquisitionCost: 3200000, status: 'ON_TRIP' },
  { id: 'v3', registrationNumber: 'TN07EF4421', name: 'Van-08', type: 'Van', maxLoadCapacity: 500, odometer: 67120, acquisitionCost: 780000, status: 'IN_SHOP' },
  { id: 'v4', registrationNumber: 'KA05GH3312', name: 'Mini Truck-02', type: 'Mini Truck', maxLoadCapacity: 1500, odometer: 98400, acquisitionCost: 1450000, status: 'AVAILABLE' },
  { id: 'v5', registrationNumber: 'MH02IJ9910', name: 'Truck-09', type: 'Heavy Truck', maxLoadCapacity: 8000, odometer: 210800, acquisitionCost: 4500000, status: 'ON_TRIP' },
  { id: 'v6', registrationNumber: 'TN03KL7722', name: 'Van-03', type: 'Van', maxLoadCapacity: 500, odometer: 156000, acquisitionCost: 720000, status: 'RETIRED' },
];

const INIT_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Alex Kumar', licenseNumber: 'TN0120210012345', licenseCategory: 'LMV', licenseExpiryDate: '2027-12-12', contactNumber: '+91 98400 12345', safetyScore: 87, status: 'AVAILABLE' },
  { id: 'd2', name: 'Ravi Shankar', licenseNumber: 'TN0920190098765', licenseCategory: 'HMV', licenseExpiryDate: '2025-08-20', contactNumber: '+91 94450 67890', safetyScore: 92, status: 'ON_TRIP' },
  { id: 'd3', name: 'Suresh Babu', licenseNumber: 'KA0520220034512', licenseCategory: 'LMV', licenseExpiryDate: '2028-03-15', contactNumber: '+91 87654 32109', safetyScore: 78, status: 'AVAILABLE' },
  { id: 'd4', name: 'Imran Khan', licenseNumber: 'MH0220230056789', licenseCategory: 'HMV', licenseExpiryDate: '2026-06-02', contactNumber: '+91 99001 45678', safetyScore: 85, status: 'OFF_DUTY' },
  { id: 'd5', name: 'Mahesh Yadav', licenseNumber: 'DL0120210087654', licenseCategory: 'HMV', licenseExpiryDate: '2026-11-30', contactNumber: '+91 96000 78901', safetyScore: 90, status: 'ON_TRIP' },
  { id: 'd6', name: 'Raj Anand', licenseNumber: 'TN0720200012398', licenseCategory: 'LMV', licenseExpiryDate: '2026-06-02', contactNumber: '+91 90000 23456', safetyScore: 65, status: 'SUSPENDED' },
];

const INIT_TRIPS: Trip[] = [
  { id: 'TR-1042', source: 'Chennai', destination: 'Bengaluru', vehicleId: 'v2', driverId: 'd2', cargoWeight: 3200, plannedDistance: 350, status: 'DISPATCHED', createdAt: '2026-07-12T06:30:00', dispatchedAt: '2026-07-12T07:00:00' },
  { id: 'TR-1041', source: 'Kochi', destination: 'Bengaluru', vehicleId: 'v5', driverId: 'd5', cargoWeight: 4500, plannedDistance: 560, status: 'DISPATCHED', createdAt: '2026-07-11T15:00:00', dispatchedAt: '2026-07-11T16:00:00' },
  { id: 'TR-1040', source: 'Chennai', destination: 'Hyderabad', vehicleId: 'v1', driverId: 'd1', cargoWeight: 380, plannedDistance: 625, status: 'COMPLETED', createdAt: '2026-07-10T08:00:00', dispatchedAt: '2026-07-10T09:00:00', completedAt: '2026-07-11T18:00:00' },
  { id: 'TR-1039', source: 'Mumbai', destination: 'Pune', vehicleId: 'v4', driverId: 'd3', cargoWeight: 900, plannedDistance: 148, status: 'COMPLETED', createdAt: '2026-07-09T10:00:00', dispatchedAt: '2026-07-09T11:00:00', completedAt: '2026-07-09T16:00:00' },
  { id: 'TR-1038', source: 'Delhi', destination: 'Jaipur', vehicleId: 'v4', driverId: 'd4', cargoWeight: 400, plannedDistance: 268, status: 'CANCELLED', createdAt: '2026-07-08T09:00:00' },
];

const INIT_MAINTENANCE: MaintenanceRecord[] = [
  { id: 'm1', vehicleId: 'v3', type: 'Engine Repair', description: 'Coolant system overhaul and radiator replacement', cost: 48000, startDate: '2026-07-10', status: 'ACTIVE' },
  { id: 'm2', vehicleId: 'v2', type: 'Scheduled Service', description: '30,000 km scheduled maintenance service', cost: 12500, startDate: '2026-06-28', closedDate: '2026-06-29', status: 'CLOSED' },
  { id: 'm3', vehicleId: 'v1', type: 'Tyre Replacement', description: 'All four tyres replaced — front and rear axles', cost: 28000, startDate: '2026-06-15', closedDate: '2026-06-15', status: 'CLOSED' },
];

const INIT_FUEL: FuelLog[] = [
  { id: 'f1', vehicleId: 'v1', liters: 42.5, cost: 4505, date: '2026-07-12', odometer: 84230, efficiency: 10.21 },
  { id: 'f2', vehicleId: 'v2', liters: 180.0, cost: 19080, date: '2026-07-11', odometer: 142560, efficiency: 8.40 },
  { id: 'f3', vehicleId: 'v4', liters: 65.0, cost: 6890, date: '2026-07-10', odometer: 98400, efficiency: 11.35 },
  { id: 'f4', vehicleId: 'v5', liters: 220.0, cost: 23320, date: '2026-07-09', odometer: 210800, efficiency: 7.82 },
  { id: 'f5', vehicleId: 'v1', liters: 38.0, cost: 4028, date: '2026-07-07', odometer: 83797, efficiency: 10.45 },
  { id: 'f6', vehicleId: 'v4', liters: 58.5, cost: 6201, date: '2026-07-06', odometer: 97953, efficiency: 10.95 },
];

const INIT_EXPENSES: Expense[] = [
  { id: 'e1', vehicleId: 'v2', category: 'Toll', description: 'Chennai–Bengaluru highway toll', amount: 1840, date: '2026-07-11' },
  { id: 'e2', vehicleId: 'v5', category: 'Toll', description: 'Kochi–Bengaluru highway toll', amount: 2650, date: '2026-07-11' },
  { id: 'e3', vehicleId: 'v3', category: 'Maintenance', description: 'Engine repair — additional parts', amount: 12000, date: '2026-07-10' },
  { id: 'e4', vehicleId: 'v1', category: 'Other', description: 'Driver meal allowance — overnight run', amount: 800, date: '2026-07-09' },
];

const INIT_STATE: AppState = {
  vehicles: INIT_VEHICLES, drivers: INIT_DRIVERS, trips: INIT_TRIPS,
  maintenance: INIT_MAINTENANCE, fuelLogs: INIT_FUEL, expenses: INIT_EXPENSES,
};

// ============================================================
// REDUCER
// ============================================================

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_VEHICLE':
      return { ...state, vehicles: [...state.vehicles, action.vehicle] };
    case 'UPDATE_VEHICLE_STATUS':
      return { ...state, vehicles: state.vehicles.map(v => v.id === action.vehicleId ? { ...v, status: action.status } : v) };
    case 'ADD_DRIVER':
      return { ...state, drivers: [...state.drivers, action.driver] };
    case 'UPDATE_DRIVER':
      return {
        ...state,
        drivers: state.drivers.map(d => d.id === action.driverId ? { ...d, ...action.updates } : d),
      };
    case 'DISPATCH_TRIP':
      return {
        ...state,
        trips: [...state.trips, action.trip],
        vehicles: state.vehicles.map(v => v.id === action.trip.vehicleId ? { ...v, status: 'ON_TRIP' } : v),
        drivers: state.drivers.map(d => d.id === action.trip.driverId ? { ...d, status: 'ON_TRIP' } : d),
      };
    case 'APPLY_RECOVERY_ASSIGNMENTS':
      return {
        ...state,
        trips: state.trips.map(trip => {
          const match = action.assignments.find(item => item.tripId === trip.id);
          return match ? { ...trip, vehicleId: match.vehicleId, driverId: match.driverId } : trip;
        }),
        vehicles: state.vehicles.map(vehicle => {
          const assigned = action.assignments.some(item => item.vehicleId === vehicle.id);
          return assigned ? { ...vehicle, status: 'ON_TRIP' } : vehicle;
        }),
        drivers: state.drivers.map(driver => {
          const assigned = action.assignments.some(item => item.driverId === driver.id);
          return assigned ? { ...driver, status: 'ON_TRIP' } : driver;
        }),
      };
    case 'COMPLETE_TRIP':
      return {
        ...state,
        trips: state.trips.map(t => t.id === action.tripId ? { ...t, status: 'COMPLETED', completedAt: new Date().toISOString() } : t),
        vehicles: state.vehicles.map(v => v.id === action.vehicleId ? { ...v, status: 'AVAILABLE' } : v),
        drivers: state.drivers.map(d => d.id === action.driverId ? { ...d, status: 'AVAILABLE' } : d),
      };
    case 'CANCEL_TRIP':
      return {
        ...state,
        trips: state.trips.map(t => t.id === action.tripId ? { ...t, status: 'CANCELLED' } : t),
        vehicles: state.vehicles.map(v => v.id === action.vehicleId ? { ...v, status: 'AVAILABLE' } : v),
        drivers: state.drivers.map(d => d.id === action.driverId ? { ...d, status: 'AVAILABLE' } : d),
      };
    case 'CREATE_MAINTENANCE':
      return {
        ...state,
        maintenance: [...state.maintenance, action.record],
        vehicles: state.vehicles.map(v => v.id === action.record.vehicleId ? { ...v, status: 'IN_SHOP' } : v),
      };
    case 'CLOSE_MAINTENANCE':
      return {
        ...state,
        maintenance: state.maintenance.map(m => m.id === action.maintenanceId ? { ...m, status: 'CLOSED', closedDate: TODAY } : m),
        vehicles: state.vehicles.map(v => v.id === action.vehicleId && v.status !== 'RETIRED' ? { ...v, status: 'AVAILABLE' } : v),
      };
    case 'ADD_FUEL_LOG':
      return { ...state, fuelLogs: [action.log, ...state.fuelLogs] };
    case 'ADD_EXPENSE':
      return { ...state, expenses: [action.expense, ...state.expenses] };
    default:
      return state;
  }
}

// ============================================================
// CONTEXT
// ============================================================

type Route =
  | 'login' | 'overview' | 'vehicles' | 'drivers'
  | 'trips' | 'trips-new' | 'maintenance' | 'expenses'
  | 'reports' | 'settings' | 'my-trips' | 'profile';

interface AppCtx {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  route: Route;
  navigate: (r: Route) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  login: (user: AuthenticatedUser) => void;
  logout: () => void;
  disruptions: DisruptionEvent[];
  setDisruptions: React.Dispatch<React.SetStateAction<DisruptionEvent[]>>;
  recoveryHistory: RecoveryHistoryEntry[];
  setRecoveryHistory: React.Dispatch<React.SetStateAction<RecoveryHistoryEntry[]>>;
  activeRecoveryDisruption: DisruptionEvent | null;
  setActiveRecoveryDisruption: (d: DisruptionEvent | null) => void;
  showAutoRescueWorkspace: boolean;
  setShowAutoRescueWorkspace: (v: boolean) => void;
}

export const AppContext = createContext<AppCtx>(null as unknown as AppCtx);
export const useApp = () => useContext(AppContext);

// ============================================================
// CHART TOOLTIP STYLE HOOK
// ============================================================

function useTooltipStyle(fontSize = 11) {
  const { darkMode } = useApp();
  return {
    background: darkMode ? '#181c26' : '#ffffff',
    border: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 4,
    fontSize,
    color: darkMode ? '#e4e6f0' : '#111318',
  };
}

function useAxisTickStyle() {
  const { darkMode } = useApp();
  return { fontSize: 11, fill: darkMode ? '#878ba4' : '#9ca3af' };
}

// ============================================================
// STATUS BADGE
// ============================================================

type StatusVariant = VehicleStatus | DriverStatus | TripStatus;

const STATUS_META: Record<StatusVariant, { label: string; dot: string; text: string; bg: string }> = {
  AVAILABLE:  { label: 'Available',  dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ON_TRIP:    { label: 'On Trip',    dot: 'bg-blue-400',    text: 'text-blue-400',    bg: 'bg-blue-400/10' },
  IN_SHOP:    { label: 'In Shop',    dot: 'bg-amber-400',   text: 'text-amber-400',   bg: 'bg-amber-400/10' },
  RETIRED:    { label: 'Retired',    dot: 'bg-zinc-500',    text: 'text-zinc-400',    bg: 'bg-zinc-500/10' },
  OFF_DUTY:   { label: 'Off Duty',   dot: 'bg-zinc-500',    text: 'text-zinc-400',    bg: 'bg-zinc-500/10' },
  SUSPENDED:  { label: 'Suspended',  dot: 'bg-red-400',     text: 'text-red-400',     bg: 'bg-red-400/10' },
  DRAFT:      { label: 'Draft',      dot: 'bg-zinc-500',    text: 'text-zinc-400',    bg: 'bg-zinc-500/10' },
  DISPATCHED: { label: 'Dispatched', dot: 'bg-blue-400',    text: 'text-blue-400',    bg: 'bg-blue-400/10' },
  COMPLETED:  { label: 'Completed',  dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  CANCELLED:  { label: 'Cancelled',  dot: 'bg-zinc-500',    text: 'text-zinc-400',    bg: 'bg-zinc-500/10' },
};

function StatusBadge({ status }: { status: StatusVariant }) {
  const m = STATUS_META[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium', m.bg, m.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', m.dot)} />
      {m.label}
    </span>
  );
}

// ============================================================
// BUTTON
// ============================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: ReactNode;
}

function Button({ variant = 'secondary', size = 'md', loading, icon, children, className, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-amber-600',
    secondary: 'bg-card border border-border text-foreground hover:bg-accent',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-accent',
    danger: 'bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20',
  };
  const sizes = { sm: 'px-2.5 py-1 text-xs', md: 'px-3 py-1.5 text-[0.8125rem]' };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ============================================================
// INPUT / SELECT / TEXTAREA
// ============================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; hint?: string;
}

function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground">{label}</label>}
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-1.5 rounded bg-input-background border border-border text-foreground text-[0.8125rem]',
          'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
          error && 'border-destructive/60 focus:ring-destructive/40',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; options: { value: string; label: string }[];
}

function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={selectId} className="text-xs font-medium text-muted-foreground">{label}</label>}
      <select
        id={selectId}
        className={cn(
          'w-full px-3 py-1.5 rounded bg-input-background border border-border text-foreground text-[0.8125rem]',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none',
          error && 'border-destructive/60',
          className
        )}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string;
}

function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const taId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={taId} className="text-xs font-medium text-muted-foreground">{label}</label>}
      <textarea
        id={taId}
        rows={3}
        className={cn(
          'w-full px-3 py-1.5 rounded bg-input-background border border-border text-foreground text-[0.8125rem]',
          'placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none',
          error && 'border-destructive/60',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ============================================================
// TABS
// ============================================================

interface TabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-border">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            'px-4 py-2.5 text-[0.8125rem] font-medium border-b-2 -mb-px transition-colors',
            t.id === active
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// DRAWER
// ============================================================

interface DrawerProps {
  open: boolean; onClose: () => void; title: string;
  subtitle?: string; children: ReactNode; footer?: ReactNode;
  width?: string;
}

function Drawer({ open, onClose, title, subtitle, children, footer, width = 'w-[460px]' }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className={cn('flex flex-col bg-card border-l border-border h-full shadow-2xl', width)}
          >
            <div className="flex items-start justify-between p-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent -mt-0.5 -mr-1" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
            {footer && <div className="border-t border-border p-4 flex-shrink-0">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// MODAL / CONFIRM DIALOG
// ============================================================

interface ModalProps {
  open: boolean; onClose: () => void; title: string;
  children: ReactNode; footer?: ReactNode; maxWidth?: string;
}

function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn('relative w-full bg-card border border-border rounded-lg shadow-2xl', maxWidth)}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
              <h2 className="text-sm font-semibold">{title}</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent" aria-label="Close">
                <X size={15} />
              </button>
            </div>
            <div className="p-4">{children}</div>
            {footer && <div className="border-t border-border px-4 py-3 flex justify-end gap-2">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

// Animated table row with stagger
function AnimatedRow({ children, index, className, onClick }: { children: ReactNode; index: number; className?: string; onClick?: () => void }) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.028, ease: 'easeOut' }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.tr>
  );
}

function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-muted-foreground/30 mb-3">
        <Package size={32} strokeWidth={1.5} />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ============================================================
// SKELETON
// ============================================================

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-muted rounded', className)} />;
}

function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" style={{ opacity: 0.6 - j * 0.05 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// DESCRIPTION LIST
// ============================================================

function DescriptionList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-border">
      {items.map(item => (
        <div key={item.label} className="flex items-center justify-between py-2.5">
          <dt className="text-xs text-muted-foreground">{item.label}</dt>
          <dd className="text-[0.8125rem] font-medium text-foreground text-right">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

// ============================================================
// ACTIVITY LIST
// ============================================================

interface ActivityItem { icon: ReactNode; description: string; time: string; }

function ActivityList({ items }: { items: ActivityItem[] }) {
  if (!items.length) return <p className="text-xs text-muted-foreground py-4 text-center">No recent activity.</p>;
  return (
    <ul className="divide-y divide-border">
      {items.map((item, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22, delay: i * 0.05, ease: 'easeOut' }}
          className="flex items-start gap-3 py-3"
        >
          <div className="text-muted-foreground flex-shrink-0 mt-0.5">{item.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.8125rem] text-foreground leading-snug">{item.description}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

// ============================================================
// STATE TRANSITION
// ============================================================

function StateTransition({ from, to, entity }: { from: string; to: string; entity?: string }) {
  return (
    <div className="flex items-center gap-2 text-[0.8125rem]">
      {entity && <span className="text-muted-foreground">{entity}</span>}
      <span className="font-medium text-foreground">{from}</span>
      <ArrowRight size={12} className="text-muted-foreground flex-shrink-0" />
      <span className="font-medium text-primary">{to}</span>
    </div>
  );
}

// ============================================================
// VALIDATION LIST
// ============================================================

type ValidationState = 'pass' | 'fail' | 'pending';
interface ValidationItem {
  id: string; label: string; state: ValidationState;
  message?: string; actionLabel?: string; onAction?: () => void;
}

function ValidationList({ items }: { items: ValidationItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: i * 0.06, ease: 'easeOut' }}
          className={cn(
          'flex items-start gap-3 px-3 py-2.5 rounded border',
          item.state === 'pass' && 'bg-emerald-400/5 border-emerald-400/15',
          item.state === 'fail' && 'bg-red-400/5 border-red-400/20',
          item.state === 'pending' && 'bg-muted border-border',
        )}>
          <span className="mt-0.5 flex-shrink-0">
            {item.state === 'pass' && <CheckCircle2 size={14} className="text-emerald-400" />}
            {item.state === 'fail' && <XCircle size={14} className="text-red-400" />}
            {item.state === 'pending' && <Clock size={14} className="text-muted-foreground" />}
          </span>
          <div className="flex-1 min-w-0">
            <p className={cn('text-[0.8125rem] font-medium',
              item.state === 'pass' && 'text-emerald-400',
              item.state === 'fail' && 'text-red-400',
              item.state === 'pending' && 'text-muted-foreground',
            )}>{item.label}</p>
            {item.message && <p className="text-xs text-muted-foreground mt-0.5">{item.message}</p>}
            {item.state === 'fail' && item.actionLabel && item.onAction && (
              <button onClick={item.onAction} className="text-xs text-primary hover:underline mt-1">{item.actionLabel}</button>
            )}
          </div>
        </motion.li>
      ))}
    </ul>
  );
}

// ============================================================
// METRIC
// ============================================================

function Metric({ label, value, context }: { label: string; value: string | number; context?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums text-foreground leading-none">{value}</p>
      {context && <p className="text-xs text-muted-foreground">{context}</p>}
    </div>
  );
}

function MetricStrip({ metrics }: { metrics: { label: string; value: string | number; context?: string }[] }) {
  return (
    <div className="grid border border-border rounded-md divide-x divide-border" style={{ gridTemplateColumns: `repeat(${metrics.length}, 1fr)` }}>
      {metrics.map((m, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, delay: i * 0.07, ease: 'easeOut' }}
          className="px-4 py-3"
        >
          <Metric {...m} />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================
// PAGE HEADER
// ============================================================

function PageHeader({
  title, description, action,
}: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-[1.375rem] font-semibold text-foreground leading-tight">{title}</h1>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ============================================================
// SIDEBAR
// ============================================================

interface NavItem { id: Route; label: string; icon: ReactNode; allowedRoles: string[]; }

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} />, allowedRoles: ['FLEET_MANAGER', 'DRIVER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'] },
  { id: 'vehicles', label: 'Vehicles', icon: <Truck size={16} />, allowedRoles: ['FLEET_MANAGER'] },
  { id: 'drivers', label: 'Drivers', icon: <Users size={16} />, allowedRoles: ['FLEET_MANAGER', 'SAFETY_OFFICER'] },
  { id: 'trips', label: 'Trips', icon: <Route size={16} />, allowedRoles: ['FLEET_MANAGER'] },
  { id: 'my-trips', label: 'My Trips', icon: <Route size={16} />, allowedRoles: ['DRIVER'] },
  { id: 'maintenance', label: 'Maintenance', icon: <Wrench size={16} />, allowedRoles: ['FLEET_MANAGER'] },
  { id: 'expenses', label: 'Fuel & Expenses', icon: <Fuel size={16} />, allowedRoles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
  { id: 'reports', label: 'Reports', icon: <BarChart3 size={16} />, allowedRoles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST', 'SAFETY_OFFICER'] },
];

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { route, navigate, user } = useApp();
  const normalizedRole = normalizeRole(user?.role);
  const allowedItems = NAV_ITEMS.filter(item => item.allowedRoles.includes(normalizedRole));

  return (
    <aside className={cn('flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 flex-shrink-0', collapsed ? 'w-16' : 'w-56')}>
      <div className={cn('flex items-center h-14 border-b border-sidebar-border flex-shrink-0', collapsed ? 'justify-center px-0' : 'px-4 gap-2')}>
        <BrandLogo showText={!collapsed} className={collapsed ? 'justify-center w-full' : ''} textClassName="text-foreground" />
      </div>

      <nav className="flex-1 py-2 overflow-y-auto">
        {allowedItems.map(item => {
          const active = route === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative w-full flex items-center gap-3 px-3 h-10 text-[0.8125rem] font-medium transition-colors rounded-none',
                active ? 'text-primary' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/10"
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                />
              )}
              <span className={cn('relative flex-shrink-0', active ? 'text-primary' : 'text-sidebar-foreground/50')}>{item.icon}</span>
              {!collapsed && <span className="relative">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border py-2">
        {normalizedRole === 'FLEET_MANAGER' && (
          <button
            onClick={() => navigate('settings')}
            title={collapsed ? 'Settings' : undefined}
            className={cn(
              'w-full flex items-center gap-3 px-3 h-10 text-[0.8125rem] font-medium transition-colors',
              route === 'settings' ? 'bg-primary/10 text-primary' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <Settings size={16} className="flex-shrink-0" />
            {!collapsed && 'Settings'}
          </button>
        )}
        <button
          onClick={onToggle}
          className={cn('w-full flex items-center gap-3 px-3 h-10 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors', collapsed && 'justify-center px-0')}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="text-xs">Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

// ============================================================
// TOP BAR
// ============================================================

function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { state, darkMode, toggleDarkMode, user, logout, navigate } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const expiringCount = state.drivers.filter(d => isNearExpiry(d.licenseExpiryDate) || isExpired(d.licenseExpiryDate)).length;
  const displayName = getDisplayName(user);
  const normalizedRole = normalizeRole(user?.role);
  const notificationItems = [
    {
      title: 'License expiry alerts',
      message: `${expiringCount} driver license${expiringCount === 1 ? '' : 's'} need attention`,
      urgent: expiringCount > 0,
    },
    {
      title: 'Trip dispatch health',
      message: `${state.trips.filter(t => t.status === 'DISPATCHED').length} active trips are on route`,
      urgent: false,
    },
    {
      title: 'Fleet readiness',
      message: `${state.vehicles.filter(v => v.status === 'AVAILABLE').length} vehicles are currently available`,
      urgent: false,
    },
  ];

  const roleLabels: Record<string, string> = {
    FLEET_MANAGER: 'Fleet Manager',
    DRIVER: 'Driver',
    FINANCIAL_ANALYST: 'Financial Analyst',
    SAFETY_OFFICER: 'Safety Officer',
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const menuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [notificationsOpen]);

  return (
    <header className="h-14 border-b border-border flex items-center px-4 gap-3 flex-shrink-0 bg-background relative">
      <button onClick={onMenuClick} className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-accent lg:hidden" aria-label="Open menu">
        <Menu size={18} />
      </button>
      <div className="flex-1 max-w-xs">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search vehicles, drivers, trips..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-input-background border border-border rounded text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
            readOnly
          />
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(o => !o)}
            className="relative p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
          >
            <Bell size={16} />
            {expiringCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-amber-500 rounded-full text-[9px] font-bold text-black flex items-center justify-center">
                {expiringCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-md shadow-lg py-2 z-50">
              <div className="px-3 pb-2 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Notifications</p>
                <p className="text-[11px] text-muted-foreground">Live fleet updates</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notificationItems.map((item, index) => (
                  <div key={index} className="px-3 py-2.5 border-b border-border/60 last:border-b-0 hover:bg-accent/50">
                    <div className="flex items-start gap-2">
                      <span className={cn('mt-1 h-2 w-2 rounded-full', item.urgent ? 'bg-amber-500' : 'bg-emerald-500')} />
                      <div>
                        <p className="text-[12px] font-medium text-foreground">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground">{item.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="relative flex items-center pl-2 border-l border-border" ref={menuRef}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 text-left hover:opacity-85 transition-opacity"
            aria-label="User menu"
            aria-expanded={menuOpen}
          >
            <div className="flex flex-col text-right hidden sm:flex">
              <span className="text-[11px] font-semibold text-foreground leading-tight">{displayName}</span>
              <span className="text-[10px] text-muted-foreground leading-none">{roleLabels[normalizedRole] || normalizedRole || 'Guest'}</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-semibold select-none">
              {getInitials(displayName)}
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-md shadow-lg py-1 z-50 text-[0.8125rem]">
              <div className="px-3 py-2 border-b border-border sm:hidden">
                <p className="font-semibold text-foreground leading-tight">{displayName}</p>
                <p className="text-[10px] text-muted-foreground">{roleLabels[normalizedRole] || normalizedRole}</p>
              </div>
              <button 
                onClick={() => { setMenuOpen(false); navigate('profile'); }}
                className="w-full text-left px-3.5 py-2 text-foreground hover:bg-accent transition-colors"
              >
                Profile
              </button>
              <button 
                onClick={() => { setMenuOpen(false); logout(); }}
                className="w-full text-left px-3.5 py-2 text-destructive hover:bg-destructive/5 transition-colors border-t border-border"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================
// APP SHELL
// ============================================================

function AppShell({ children }: { children: ReactNode }) {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Sidebar - desktop */}
      <div className="hidden lg:flex h-full">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </div>
      {/* Sidebar - mobile */}
      <div className={cn('fixed inset-y-0 left-0 z-50 flex lg:hidden transition-transform duration-200', sidebarOpen ? 'translate-x-0' : '-translate-x-full')}>
        <Sidebar collapsed={false} onToggle={() => setSidebarOpen(false)} />
      </div>
      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// ============================================================
// LOGIN PAGE
// ============================================================

function LoginPage() {
  const { login } = useApp();
  return <AuthLoginPage onLoginSuccess={login} />;
}

// ============================================================
// PROFILE PAGE
// ============================================================

function ProfilePage() {
  const { user, state } = useApp();
  const displayName = getDisplayName(user);
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const normalizedRole = normalizeRole(user?.role);
  const roleLabel = normalizedRole === 'FLEET_MANAGER' ? 'Fleet Manager' : normalizedRole || 'User';

  return (
    <div className="space-y-6">
      <PageHeader
        title={displayName !== 'User' ? `Profile · ${displayName}` : 'Profile'}
        description="Your account overview and access summary."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
              {initials}
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{displayName}</h3>
              <p className="text-sm text-muted-foreground">{user?.email || 'No email available'}</p>
              <p className="mt-1 text-xs font-medium text-primary">{roleLabel}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border bg-background/70 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Workspace</p>
              <p className="mt-1 text-sm font-medium text-foreground">TransitOps Fleet Command</p>
            </div>
            <div className="rounded-md border border-border bg-background/70 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Active vehicles</p>
              <p className="mt-1 text-sm font-medium text-foreground">{state.vehicles.filter(v => v.status === 'AVAILABLE').length}</p>
            </div>
            <div className="rounded-md border border-border bg-background/70 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Active drivers</p>
              <p className="mt-1 text-sm font-medium text-foreground">{state.drivers.filter(d => d.status === 'AVAILABLE').length}</p>
            </div>
            <div className="rounded-md border border-border bg-background/70 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Open trips</p>
              <p className="mt-1 text-sm font-medium text-foreground">{state.trips.filter(t => t.status === 'DISPATCHED').length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Quick access</h3>
          <div className="mt-4 space-y-2">
            <div className="rounded-md border border-border bg-background/70 p-3 text-sm text-muted-foreground">
              Review fleet status and dispatch health.
            </div>
            <div className="rounded-md border border-border bg-background/70 p-3 text-sm text-muted-foreground">
              Monitor driver availability and trip progress.
            </div>
            <div className="rounded-md border border-border bg-background/70 p-3 text-sm text-muted-foreground">
              Open settings to manage role permissions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OVERVIEW PAGE
// ============================================================

function OverviewPage() {
  const { state, dispatch, user, disruptions, setActiveRecoveryDisruption, setShowAutoRescueWorkspace } = useApp();
  const tooltipStyle = useTooltipStyle(12);
  const { vehicles, drivers, trips } = state;

  if (normalizeRole(user?.role) === 'DRIVER') {
    // Find driver record
    const driverRecord = state.drivers.find(d => d.name === getDisplayName(user)) || state.drivers.find(d => d.id === 'd2');
    const driverTrips = state.trips.filter(t => t.driverId === driverRecord?.id);
    const currentTrip = driverTrips.find(t => t.status === 'DISPATCHED');
    const upcomingTrips = driverTrips.filter(t => t.status === 'DRAFT');

    const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name ?? id;
    const getVehicleReg = (id: string) => vehicles.find(v => v.id === id)?.registrationNumber ?? '';

    return (
      <div className="space-y-6">
        <PageHeader 
          title={`Welcome back, ${getDisplayName(user)}`}
          description="Your current trip assignment and operational status."
        />

        {/* Current Trip Section */}
        <div className="border border-border rounded-md bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-card flex justify-between items-center">
            <h3 className="text-sm font-semibold">Active Assignment</h3>
            {currentTrip ? <StatusBadge status={currentTrip.status} /> : <span className="text-xs text-muted-foreground">No active trip</span>}
          </div>
          {currentTrip ? (
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Trip ID</span>
                  <span className="text-base font-semibold text-foreground">{currentTrip.id}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Assigned Vehicle</span>
                  <span className="text-base font-semibold text-foreground">{getVehicleName(currentTrip.vehicleId)}</span>
                  <span className="text-xs text-muted-foreground">{getVehicleReg(currentTrip.vehicleId)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Cargo Weight</span>
                  <span className="text-base font-semibold text-foreground">{formatNumber(currentTrip.cargoWeight)} kg</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Planned Distance</span>
                  <span className="text-base font-semibold text-foreground">{currentTrip.plannedDistance} km</span>
                </div>
              </div>

              {/* Route Progress */}
              <div className="border-t border-border pt-5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-4">Route Info</span>
                <div className="flex items-center justify-between px-2 text-sm font-semibold">
                  <div className="flex flex-col">
                    <span className="text-foreground">{currentTrip.source}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Origin</span>
                  </div>
                  <div className="flex-1 mx-4 flex items-center relative">
                    <div className="h-0.5 w-full bg-border" />
                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[10px] text-primary font-bold">
                      IN TRANSIT
                    </div>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-foreground">{currentTrip.destination}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">Destination</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-xs">
              No active trip has been dispatched to you.
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="border border-border rounded-md bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Upcoming Runs</h3>
          </div>
          {upcomingTrips.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              No upcoming trips assigned.
            </div>
          ) : (
            <table className="w-full text-[0.8125rem]">
              <thead>
                <tr className="border-b border-border">
                  {['Trip ID', 'Route', 'Vehicle', 'Cargo Weight', 'Distance', 'Status'].map(col => (
                    <th key={col} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {upcomingTrips.map(t => (
                  <tr key={t.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{t.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.source} → {t.destination}</td>
                    <td className="px-4 py-3">{getVehicleName(t.vehicleId)}</td>
                    <td className="px-4 py-3">{formatNumber(t.cargoWeight)} kg</td>
                    <td className="px-4 py-3">{t.plannedDistance} km</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  const metrics = useMemo(() => {
    const total = vehicles.length;
    const available = vehicles.filter(v => v.status === 'AVAILABLE').length;
    const onTrip = vehicles.filter(v => v.status === 'ON_TRIP').length;
    const inShop = vehicles.filter(v => v.status === 'IN_SHOP').length;
    const activeTrips = trips.filter(t => t.status === 'DISPATCHED').length;
    const utilization = total > 0 ? Math.round((onTrip / total) * 100) : 0;
    return { total, available, onTrip, inShop, activeTrips, utilization };
  }, [vehicles, trips]);

  const activeTrips = trips.filter(t => t.status === 'DISPATCHED');
  const tripSummary = {
    total: trips.length,
    completed: trips.filter(t => t.status === 'COMPLETED').length,
    dispatched: trips.filter(t => t.status === 'DISPATCHED').length,
    cancelled: trips.filter(t => t.status === 'CANCELLED').length,
  };

  const fleetStatusData = [
    { name: 'Available', value: metrics.available, color: '#34d399' },
    { name: 'On Trip', value: metrics.onTrip, color: '#60a5fa' },
    { name: 'In Shop', value: metrics.inShop, color: '#fbbf24' },
    { name: 'Retired', value: vehicles.filter(v => v.status === 'RETIRED').length, color: '#52525b' },
  ].filter(d => d.value > 0);

  const activity = [
    { icon: <Wrench size={13} />, description: 'Van-08 entered maintenance for engine repair', time: '12 Jul 2026 · 10:00' },
    { icon: <Route size={13} />, description: 'Trip TR-1042 dispatched — Chennai → Bengaluru', time: '12 Jul 2026 · 07:00' },
    { icon: <AlertTriangle size={13} />, description: "Ravi Shankar's driving licence has expired", time: '12 Jul 2026 · 00:00' },
    { icon: <CheckCircle2 size={13} />, description: 'Trip TR-1040 completed — Chennai → Hyderabad', time: '11 Jul 2026 · 18:00' },
    { icon: <Fuel size={13} />, description: 'Fuel log recorded for Truck-12 — 180 L', time: '11 Jul 2026 · 14:30' },
  ];

  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name ?? id;
  const getDriverName = (id: string) => drivers.find(d => d.id === id)?.name ?? id;

  return (
    <div>
      <PageHeader
        title="Overview"
        description="Monitor fleet availability and active transport operations."
      />

      <MetricStrip metrics={[
        { label: 'Total Vehicles', value: metrics.total },
        { label: 'Available', value: metrics.available, context: `of ${metrics.total} fleet vehicles` },
        { label: 'Active Trips', value: metrics.activeTrips },
        { label: 'In Maintenance', value: metrics.inShop },
        { label: 'Fleet Utilization', value: `${metrics.utilization}%`, context: 'vehicles on trip' },
      ]} />

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Operational Disruptions</h3>
          <span className="text-[11px] text-muted-foreground">AutoRescue</span>
        </div>
        {disruptions.length === 0 ? (
          <div className="rounded-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground">No active fleet disruptions</div>
        ) : (
          <div className="space-y-3">
            {disruptions.map(disruption => {
              const impactedTrips = detectImpactedTrips(disruption, {
                vehicles: state.vehicles.map(v => ({ id: v.id, name: v.name, registrationNumber: v.registrationNumber, status: v.status, maxLoadCapacity: v.maxLoadCapacity })),
                drivers: state.drivers.map(d => ({ id: d.id, name: d.name, licenseNumber: d.licenseNumber, licenseExpiryDate: d.licenseExpiryDate, status: d.status, safetyScore: d.safetyScore })),
                trips: state.trips.map(t => ({ id: t.id, source: t.source, destination: t.destination, vehicleId: t.vehicleId, driverId: t.driverId, cargoWeight: t.cargoWeight, plannedDistance: t.plannedDistance, status: t.status, createdAt: t.createdAt })),
                today: TODAY,
              });
              return (
                <div key={disruption.id} className="rounded-md border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{disruption.entityName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{disruption.reason}</p>
                      <p className="text-[11px] text-muted-foreground mt-2">{impactedTrips.length} trip{impactedTrips.length === 1 ? '' : 's'} impacted</p>
                    </div>
                    <button onClick={() => { setActiveRecoveryDisruption(disruption); setShowAutoRescueWorkspace(true); }} className="rounded border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent">Review</button>
                  </div>
                  <div className="mt-3 text-[11px] text-muted-foreground">Recovery plan ready</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mt-6">
        {/* Active Trips */}
        <div className="border border-border rounded-md overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Active Trips</h3>
          </div>
          {activeTrips.length === 0 ? (
            <EmptyState title="No active trips" description="Dispatched trips will appear here." />
          ) : (
            <table className="w-full text-[0.8125rem]">
              <thead>
                <tr className="border-b border-border">
                  {['Trip', 'Route', 'Vehicle', 'Driver', 'Status'].map(col => (
                    <th key={col} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeTrips.map(t => (
                  <tr key={t.id} className="hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{t.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-col leading-tight">
                        <span>{t.source}</span>
                        <span className="text-muted-foreground/60 text-xs">→ {t.destination}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getVehicleName(t.vehicleId)}</td>
                    <td className="px-4 py-3">{getDriverName(t.driverId)}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Fleet Status */}
        <div className="border border-border rounded-md">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Fleet Status</h3>
          </div>
          <div className="p-4">
            <div className="flex justify-center mb-4">
              <PieChart width={160} height={160}>
                <Pie data={fleetStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                  {fleetStatusData.map(d => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </div>
            <ul className="space-y-2">
              {fleetStatusData.map(d => (
                <li key={d.name} className="flex items-center justify-between text-[0.8125rem]">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-medium tabular-nums">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mt-6">
        {/* Trip Summary */}
        <div className="border border-border rounded-md">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Trip Summary</h3>
          </div>
          <div className="grid grid-cols-4 divide-x divide-border p-0">
            {[
              { label: 'Total', value: tripSummary.total },
              { label: 'Completed', value: tripSummary.completed },
              { label: 'Active', value: tripSummary.dispatched },
              { label: 'Cancelled', value: tripSummary.cancelled },
            ].map(item => (
              <div key={item.label} className="px-4 py-4 text-center">
                <p className="text-xl font-semibold tabular-nums">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border border-border rounded-md">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Recent Activity</h3>
          </div>
          <div className="px-4">
            <ActivityList items={activity} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APP SHELL SKELETON
// ============================================================

function AppShellSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex flex-col w-56 h-full bg-sidebar border-r border-sidebar-border p-4 justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2 h-8">
            <Skeleton className="w-6 h-6 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))}
          </div>
        </div>
        <Skeleton className="h-8 w-full rounded" />
      </div>
      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar skeleton */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </header>
        {/* Main area */}
        <main className="flex-1 p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-80" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </main>
      </div>
    </div>
  );
}

// ============================================================
// ACCESS DENIED PAGE
// ============================================================

function AccessDeniedPage() {
  const { navigate, user } = useApp();
  const handleReturn = () => {
    if (!user) {
      navigate('login');
      return;
    }
    if (normalizeRole(user?.role) === 'FLEET_MANAGER') navigate('overview');
    else if (user.role === 'DRIVER') navigate('my-trips');
    else if (user.role === 'FINANCIAL_ANALYST') navigate('reports');
    else if (user.role === 'SAFETY_OFFICER') navigate('drivers');
    else navigate('overview');
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-destructive/10 border border-destructive/20 text-destructive rounded-full flex items-center justify-center mb-4">
        <AlertTriangle size={24} />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        You do not have permission to access this area.
      </p>
      <Button variant="primary" className="mt-6" onClick={handleReturn}>
        Return to overview
      </Button>
    </div>
  );
}

// ============================================================
// MY TRIPS PAGE (DRIVER ONLY)
// ============================================================

function MyTripsPage() {
  const { state, user } = useApp();
  const { vehicles } = state;

  const driverRecord = state.drivers.find(d => d.name === user?.fullName) || state.drivers.find(d => d.id === 'd2');
  const driverTrips = state.trips.filter(t => t.driverId === driverRecord?.id);

  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name ?? id;

  return (
    <div>
      <PageHeader 
        title="My Trips"
        description="View your active, upcoming, and historical trip logs."
      />

      <div className="border border-border rounded-md bg-card overflow-hidden">
        {driverTrips.length === 0 ? (
          <EmptyState title="No trips assigned" description="Your assigned trips will appear here." />
        ) : (
          <table className="w-full text-[0.8125rem]">
            <thead>
              <tr className="border-b border-border bg-card">
                {['Trip ID', 'Date', 'Route', 'Vehicle', 'Cargo Weight', 'Distance', 'Status'].map(col => (
                  <th key={col} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {driverTrips.map(t => (
                <tr key={t.id} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{t.id}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.dispatchedAt ? formatDate(t.dispatchedAt) : formatDate(t.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col leading-tight">
                      <span>{t.source}</span>
                      <span className="text-[10px] text-muted-foreground">→ {t.destination}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getVehicleName(t.vehicleId)}</td>
                  <td className="px-4 py-3 font-mono">{formatNumber(t.cargoWeight)} kg</td>
                  <td className="px-4 py-3 font-mono">{t.plannedDistance} km</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============================================================
// VEHICLES PAGE
// ============================================================

function VehiclesPage() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => state.vehicles.filter(v => {
    const q = search.toLowerCase();
    const matchesSearch = !q || v.name.toLowerCase().includes(q) || v.registrationNumber.toLowerCase().includes(q);
    const matchesType = !typeFilter || v.type === typeFilter;
    const matchesStatus = !statusFilter || v.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  }), [state.vehicles, search, typeFilter, statusFilter]);

  const types = [...new Set(state.vehicles.map(v => v.type))];

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Manage fleet assets and operational availability."
        action={<Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Add vehicle</Button>}
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            placeholder="Search vehicles..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-input-background border border-border rounded text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring w-48"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-input-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-input-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All statuses</option>
          {(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'] as VehicleStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-[0.8125rem]">
          <thead>
            <tr className="border-b border-border bg-card">
              {['Registration', 'Vehicle', 'Type', 'Capacity', 'Odometer', 'Acq. Cost', 'Status', ''].map(col => (
                <th key={col} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground first:pl-4">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No vehicles found" description="Adjust your filters or register a vehicle." /></td></tr>
            ) : filtered.map((v, idx) => (
              <AnimatedRow key={v.id} index={idx} onClick={() => setSelectedVehicle(v)} className="hover:bg-accent/40 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.registrationNumber}</td>
                <td className="px-4 py-3 font-medium">{v.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{v.type}</td>
                <td className="px-4 py-3 tabular-nums text-right pr-6">{formatNumber(v.maxLoadCapacity)} kg</td>
                <td className="px-4 py-3 tabular-nums text-right pr-6">{formatNumber(v.odometer)} km</td>
                <td className="px-4 py-3 tabular-nums text-right pr-6">{formatCurrency(v.acquisitionCost)}</td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3">
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedVehicle(v); }}
                    className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </td>
              </AnimatedRow>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vehicle Detail Drawer */}
      <Drawer
        open={!!selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        title={selectedVehicle?.name ?? ''}
        subtitle={selectedVehicle?.registrationNumber}
        footer={
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setSelectedVehicle(null)}>Close</Button>
          </div>
        }
      >
        {selectedVehicle && (
          <div className="space-y-6">
            <div>
              <StatusBadge status={selectedVehicle.status} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</h3>
              <DescriptionList items={[
                { label: 'Vehicle type', value: selectedVehicle.type },
                { label: 'Max capacity', value: `${formatNumber(selectedVehicle.maxLoadCapacity)} kg` },
                { label: 'Current odometer', value: `${formatNumber(selectedVehicle.odometer)} km` },
                { label: 'Acquisition cost', value: formatCurrencyFull(selectedVehicle.acquisitionCost) },
              ]} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Activity</h3>
              <ActivityList items={[
                { icon: <CheckCircle2 size={13} />, description: `Trip completed — ${state.trips.find(t => t.vehicleId === selectedVehicle.id && t.status === 'COMPLETED')?.source ?? 'N/A'} route`, time: '11 Jul 2026 · 18:00' },
                { icon: <Fuel size={13} />, description: 'Fuel log recorded', time: '12 Jul 2026 · 09:14' },
                { icon: <Wrench size={13} />, description: 'Scheduled maintenance closed', time: '10 Jul 2026 · 17:05' },
              ]} />
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Vehicle Drawer */}
      <AddVehicleDrawer
        open={showAdd}
        onClose={() => setShowAdd(false)}
        existingRegistrations={state.vehicles.map(v => v.registrationNumber)}
        onAdd={(vehicle) => {
          dispatch({ type: 'ADD_VEHICLE', vehicle });
          setShowAdd(false);
          toast.success(`${vehicle.name} added to fleet`);
        }}
      />
    </div>
  );
}

function AddVehicleDrawer({
  open, onClose, existingRegistrations, onAdd,
}: { open: boolean; onClose: () => void; existingRegistrations: string[]; onAdd: (v: Vehicle) => void }) {
  const [form, setForm] = useState({ reg: '', name: '', type: 'Van', capacity: '', odometer: '', cost: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.reg.trim()) e.reg = 'Registration number is required.';
    else if (existingRegistrations.includes(form.reg.toUpperCase()))
      e.reg = `A vehicle with registration ${form.reg.toUpperCase()} already exists.`;
    if (!form.name.trim()) e.name = 'Vehicle name is required.';
    if (!form.capacity || isNaN(Number(form.capacity)) || Number(form.capacity) <= 0) e.capacity = 'Enter a valid capacity.';
    if (!form.odometer || isNaN(Number(form.odometer))) e.odometer = 'Enter a valid odometer reading.';
    if (!form.cost || isNaN(Number(form.cost))) e.cost = 'Enter a valid acquisition cost.';
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onAdd({
      id: uid(), registrationNumber: form.reg.toUpperCase().trim(), name: form.name.trim(),
      type: form.type, maxLoadCapacity: Number(form.capacity), odometer: Number(form.odometer),
      acquisitionCost: Number(form.cost), status: 'AVAILABLE',
    });
    setForm({ reg: '', name: '', type: 'Van', capacity: '', odometer: '', cost: '' });
  };

  return (
    <Drawer
      open={open} onClose={onClose} title="Add vehicle"
      subtitle="Register a new fleet asset"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Add vehicle</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input label="Registration Number" placeholder="TN01AB1234" value={form.reg} onChange={e => set('reg', e.target.value)} error={errors.reg} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vehicle Name / Model" placeholder="Van-07" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} />
          <Select label="Vehicle Type" value={form.type} onChange={e => set('type', e.target.value)}
            options={[{ value: 'Van', label: 'Van' }, { value: 'Mini Truck', label: 'Mini Truck' }, { value: 'Heavy Truck', label: 'Heavy Truck' }]} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Max Load Capacity (kg)" type="number" placeholder="500" value={form.capacity} onChange={e => set('capacity', e.target.value)} error={errors.capacity} />
          <Input label="Current Odometer (km)" type="number" placeholder="0" value={form.odometer} onChange={e => set('odometer', e.target.value)} error={errors.odometer} />
        </div>
        <Input label="Acquisition Cost (₹)" type="number" placeholder="850000" value={form.cost} onChange={e => set('cost', e.target.value)} error={errors.cost} />
      </div>
    </Drawer>
  );
}

// ============================================================
// DRIVERS PAGE
// ============================================================

function DriversPage() {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [renewalDriver, setRenewalDriver] = useState<Driver | null>(null);
  const [renewalDate, setRenewalDate] = useState('');
  const [renewalError, setRenewalError] = useState('');

  const filtered = useMemo(() => state.drivers.filter(d => {
    const q = search.toLowerCase();
    const matchesSearch = !q || d.name.toLowerCase().includes(q) || d.licenseNumber.toLowerCase().includes(q);
    const matchesStatus = !statusFilter || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [state.drivers, search, statusFilter]);

  const licenceStatus = (d: Driver) => {
    if (isExpired(d.licenseExpiryDate)) return 'expired';
    if (isNearExpiry(d.licenseExpiryDate)) return 'near';
    return 'ok';
  };

  const handleRenewLicence = () => {
    if (!renewalDriver || !renewalDate) {
      setRenewalError('Please choose a new expiry date.');
      return;
    }

    dispatch({
      type: 'UPDATE_DRIVER',
      driverId: renewalDriver.id,
      updates: { licenseExpiryDate: renewalDate },
    });

    const updatedDriver = { ...renewalDriver, licenseExpiryDate: renewalDate };
    setSelectedDriver(updatedDriver);
    setRenewalDriver(null);
    setRenewalDate('');
    setRenewalError('');
    toast.success(`${renewalDriver.name} licence updated`);
  };

  return (
    <div>
      <PageHeader
        title="Drivers"
        description="Manage driver availability and licence compliance."
        action={<Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowAdd(true)}>Add driver</Button>}
      />

      <div className="flex gap-2 mb-4">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            placeholder="Search drivers..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs bg-input-background border border-border rounded text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring w-48"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-input-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All statuses</option>
          {(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'] as DriverStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-[0.8125rem]">
          <thead>
            <tr className="border-b border-border bg-card">
              {['Driver', 'Licence Number', 'Category', 'Expiry', 'Safety Score', 'Status', ''].map(col => (
                <th key={col} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={7}><EmptyState title="No drivers found" description="Adjust your filters or add a driver." /></td></tr>
            ) : filtered.map((d, idx) => {
              const ls = licenceStatus(d);
              const days = daysUntil(d.licenseExpiryDate);
              return (
                <AnimatedRow key={d.id} index={idx} onClick={() => setSelectedDriver(d)} className="hover:bg-accent/40 cursor-pointer transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground flex-shrink-0">
                        {d.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.licenseNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{d.licenseCategory}</td>
                  <td className="px-4 py-3">
                    {ls === 'expired' ? (
                      <span className="text-red-400 text-xs flex items-center gap-1">
                        <XCircle size={12} /> Expired {formatDate(d.licenseExpiryDate)}
                      </span>
                    ) : ls === 'near' ? (
                      <span className="text-amber-400 text-xs flex items-center gap-1">
                        <AlertTriangle size={12} /> {days}d remaining
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">{formatDate(d.licenseExpiryDate)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    <span className="font-medium">{d.safetyScore}</span>
                    <span className="text-muted-foreground text-xs">/100</span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); setSelectedDriver(d); }} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-accent">
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </AnimatedRow>
              );
            })}
          </tbody>
        </table>
      </div>

      <Drawer open={!!selectedDriver} onClose={() => setSelectedDriver(null)}
        title={selectedDriver?.name ?? ''} subtitle={selectedDriver?.licenseNumber}
        footer={<div className="flex justify-end"><Button variant="secondary" onClick={() => setSelectedDriver(null)}>Close</Button></div>}
      >
        {selectedDriver && (() => {
          const ls = licenceStatus(selectedDriver);
          const days = daysUntil(selectedDriver.licenseExpiryDate);
          return (
            <div className="space-y-6">
              <StatusBadge status={selectedDriver.status} />
              {ls === 'expired' && (
                <div className="space-y-3">
                  <div className="flex gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded text-xs text-red-400">
                    <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                    <div>Driving licence expired on {formatDate(selectedDriver.licenseExpiryDate)}. This driver cannot be dispatched until renewed.</div>
                  </div>

                  {!renewalDriver ? (
                    <Button variant="primary" onClick={() => { setRenewalDriver(selectedDriver); setRenewalDate(''); setRenewalError(''); }}>
                      Update licence
                    </Button>
                  ) : (
                    <div className="rounded border border-border bg-background/70 p-3 space-y-3">
                      <Input
                        label="New licence expiry date"
                        type="date"
                        value={renewalDate}
                        onChange={e => { setRenewalDate(e.target.value); setRenewalError(''); }}
                        error={renewalError}
                      />
                      <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => { setRenewalDriver(null); setRenewalDate(''); setRenewalError(''); }}>Cancel</Button>
                        <Button variant="primary" onClick={handleRenewLicence}>Save update</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {ls === 'near' && (
                <div className="flex gap-2 p-3 bg-amber-400/10 border border-amber-400/20 rounded text-xs text-amber-400">
                  <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
                  <div>Licence expires in {days} days ({formatDate(selectedDriver.licenseExpiryDate)}). Schedule renewal.</div>
                </div>
              )}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</h3>
                <DescriptionList items={[
                  { label: 'Licence category', value: selectedDriver.licenseCategory },
                  { label: 'Licence expiry', value: formatDate(selectedDriver.licenseExpiryDate) },
                  { label: 'Safety score', value: `${selectedDriver.safetyScore}/100` },
                  { label: 'Contact', value: selectedDriver.contactNumber },
                ]} />
              </div>
            </div>
          );
        })()}
      </Drawer>

      <AddDriverDrawer
        open={showAdd} onClose={() => setShowAdd(false)}
        onAdd={(driver) => { dispatch({ type: 'ADD_DRIVER', driver }); setShowAdd(false); toast.success(`${driver.name} added`); }}
      />
    </div>
  );
}

function AddDriverDrawer({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (d: Driver) => void }) {
  const [form, setForm] = useState({ name: '', licenseNumber: '', licenseCategory: 'LMV', licenseExpiryDate: '', contactNumber: '', safetyScore: '80' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (f: string, v: string) => { setForm(p => ({ ...p, [f]: v })); setErrors(e => ({ ...e, [f]: '' })); };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.licenseNumber.trim()) e.licenseNumber = 'Licence number is required.';
    if (!form.licenseExpiryDate) e.licenseExpiryDate = 'Expiry date is required.';
    if (Object.keys(e).length) { setErrors(e); return; }
    onAdd({
      id: uid(), name: form.name.trim(), licenseNumber: form.licenseNumber.trim(),
      licenseCategory: form.licenseCategory, licenseExpiryDate: form.licenseExpiryDate,
      contactNumber: form.contactNumber.trim(), safetyScore: Number(form.safetyScore), status: 'AVAILABLE',
    });
    setForm({ name: '', licenseNumber: '', licenseCategory: 'LMV', licenseExpiryDate: '', contactNumber: '', safetyScore: '80' });
  };

  return (
    <Drawer open={open} onClose={onClose} title="Add driver" subtitle="Register a new fleet driver"
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={handleSubmit}>Add driver</Button></div>}
    >
      <div className="space-y-4">
        <Input label="Full Name" placeholder="Alex Kumar" value={form.name} onChange={e => set('name', e.target.value)} error={errors.name} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Licence Number" placeholder="TN0120210012345" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} error={errors.licenseNumber} />
          <Select label="Category" value={form.licenseCategory} onChange={e => set('licenseCategory', e.target.value)}
            options={[{ value: 'LMV', label: 'LMV' }, { value: 'HMV', label: 'HMV' }, { value: 'HPMV', label: 'HPMV' }]} />
        </div>
        <Input label="Licence Expiry Date" type="date" value={form.licenseExpiryDate} onChange={e => set('licenseExpiryDate', e.target.value)} error={errors.licenseExpiryDate} />
        <Input label="Contact Number" placeholder="+91 98400 12345" value={form.contactNumber} onChange={e => set('contactNumber', e.target.value)} />
        <Input label="Safety Score (0–100)" type="number" min="0" max="100" value={form.safetyScore} onChange={e => set('safetyScore', e.target.value)} />
      </div>
    </Drawer>
  );
}

// ============================================================
// TRIPS LIST PAGE
// ============================================================

function TripsPage() {
  const { state, dispatch, navigate, recoveryHistory, setRecoveryHistory, setDisruptions, setActiveRecoveryDisruption, setShowAutoRescueWorkspace } = useApp();
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmTrip, setConfirmTrip] = useState<{ trip: Trip; action: 'complete' | 'cancel' } | null>(null);

  const filtered = useMemo(() =>
    state.trips.filter(t => !statusFilter || t.status === statusFilter)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.trips, statusFilter]
  );

  const getVehicleName = (id: string) => state.vehicles.find(v => v.id === id)?.name ?? id;
  const getDriverName = (id: string) => state.drivers.find(d => d.id === id)?.name ?? id;

  const handleAction = () => {
    if (!confirmTrip) return;
    const { trip, action } = confirmTrip;
    if (action === 'complete') {
      dispatch({ type: 'COMPLETE_TRIP', tripId: trip.id, vehicleId: trip.vehicleId, driverId: trip.driverId });
      toast.success(`Trip ${trip.id} completed`);
    } else {
      dispatch({ type: 'CANCEL_TRIP', tripId: trip.id, vehicleId: trip.vehicleId, driverId: trip.driverId });
      const disruption: DisruptionEvent = {
        id: uid(),
        type: 'TRIP_CANCELLED',
        entityId: trip.id,
        entityName: trip.id,
        reason: `Trip ${trip.id} was cancelled and requires reassessment`,
        occurredAt: new Date().toISOString(),
      };
      setDisruptions(prev => [disruption, ...prev.filter(item => item.entityId !== trip.id || item.type !== 'TRIP_CANCELLED')]);
      setActiveRecoveryDisruption(disruption);
      setShowAutoRescueWorkspace(true);
      toast.success(`Trip ${trip.id} cancelled`);
    }
    setConfirmTrip(null);
  };

  return (
    <div>
      <PageHeader
        title="Trips"
        description="Manage transport dispatches and trip lifecycle."
        action={<Button variant="primary" icon={<Plus size={14} />} onClick={() => navigate('trips-new')}>Create trip</Button>}
      />

      <div className="flex gap-2 mb-4">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-input-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">All statuses</option>
          {(['DISPATCHED', 'COMPLETED', 'CANCELLED', 'DRAFT'] as TripStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-[0.8125rem]">
          <thead>
            <tr className="border-b border-border bg-card">
              {['Trip ID', 'Route', 'Vehicle', 'Driver', 'Cargo', 'Distance', 'Status', ''].map(col => (
                <th key={col} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={8}><EmptyState title="No trips found" description="Dispatched trips will appear here." /></td></tr>
            ) : filtered.map((t, idx) => (
              <AnimatedRow key={t.id} index={idx} className="hover:bg-accent/40 transition-colors">
                <td className="px-4 py-3 font-medium">{t.id}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col leading-tight">
                    <span>{t.source}</span>
                    <span className="text-muted-foreground/60 text-xs">→ {t.destination}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{getVehicleName(t.vehicleId)}</td>
                <td className="px-4 py-3">{getDriverName(t.driverId)}</td>
                <td className="px-4 py-3 tabular-nums text-right pr-4">{formatNumber(t.cargoWeight)} kg</td>
                <td className="px-4 py-3 tabular-nums text-right pr-4">{formatNumber(t.plannedDistance)} km</td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-3">
                  {t.status === 'DISPATCHED' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="secondary" onClick={() => setConfirmTrip({ trip: t, action: 'complete' })}>Complete</Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmTrip({ trip: t, action: 'cancel' })}>Cancel</Button>
                    </div>
                  )}
                </td>
              </AnimatedRow>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!confirmTrip}
        onClose={() => setConfirmTrip(null)}
        title={confirmTrip?.action === 'complete' ? 'Complete trip?' : 'Cancel trip?'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmTrip(null)}>Back</Button>
            <Button
              variant={confirmTrip?.action === 'complete' ? 'primary' : 'danger'}
              onClick={handleAction}
            >
              {confirmTrip?.action === 'complete' ? 'Complete trip' : 'Cancel trip'}
            </Button>
          </>
        }
      >
        {confirmTrip && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {confirmTrip.action === 'complete'
                ? `Marking trip ${confirmTrip.trip.id} as completed will restore the vehicle and driver to Available.`
                : `Cancelling trip ${confirmTrip.trip.id} will release the vehicle and driver back to Available.`}
            </p>
            <div className="space-y-2 p-3 bg-muted rounded border border-border">
              <StateTransition
                entity={state.vehicles.find(v => v.id === confirmTrip.trip.vehicleId)?.name}
                from="On Trip" to="Available"
              />
              <StateTransition
                entity={state.drivers.find(d => d.id === confirmTrip.trip.driverId)?.name}
                from="On Trip" to="Available"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================================
// TRIP DISPATCHER
// ============================================================

interface TripDraft {
  source: string; destination: string; plannedDistance: string;
  vehicleId: string; driverId: string; cargoWeight: string;
}

function TripDispatcherPage() {
  const { state, dispatch, navigate } = useApp();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<TripDraft>({ source: '', destination: '', plannedDistance: '', vehicleId: '', driverId: '', cargoWeight: '' });
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [dispatched, setDispatched] = useState<Trip | null>(null);

  // Smart Dispatch state
  const [showSmartDispatch, setShowSmartDispatch] = useState(false);
  const [smartDispatchLoading, setSmartDispatchLoading] = useState(false);
  const [smartDispatchResponse, setSmartDispatchResponse] = useState<SmartDispatchResponse | null>(null);
  const [smartDispatchError, setSmartDispatchError] = useState<string | null>(null);
  const [smartDispatchApplied, setSmartDispatchApplied] = useState(false);
  const [appliedRecommendationScore, setAppliedRecommendationScore] = useState<number | null>(null);

  const steps = ['Route', 'Vehicle', 'Driver', 'Cargo', 'Review'];
  const selectedVehicle = state.vehicles.find(v => v.id === draft.vehicleId);
  const selectedDriver = state.drivers.find(d => d.id === draft.driverId);

  const setField = (f: keyof TripDraft, v: string) => {
    setDraft(prev => ({ ...prev, [f]: v }));
    setStepErrors(e => ({ ...e, [f]: '' }));
  };

  const validateStep = (s: number): boolean => {
    const errors: Record<string, string> = {};
    if (s === 0) {
      if (!draft.source.trim()) errors.source = 'Source is required.';
      if (!draft.destination.trim()) errors.destination = 'Destination is required.';
      if (draft.source.trim() && draft.destination.trim() && draft.source.trim().toLowerCase() === draft.destination.trim().toLowerCase())
        errors.destination = 'Source and destination cannot be the same.';
      if (!draft.plannedDistance || Number(draft.plannedDistance) <= 0) errors.plannedDistance = 'Enter a valid distance.';
    }
    if (s === 1 && !draft.vehicleId) errors.vehicleId = 'Select a vehicle.';
    if (s === 2 && !draft.driverId) errors.driverId = 'Select a driver.';
    if (s === 3) {
      const w = Number(draft.cargoWeight);
      if (!draft.cargoWeight || isNaN(w) || w <= 0) errors.cargoWeight = 'Enter a valid cargo weight.';
      if (selectedVehicle && w > selectedVehicle.maxLoadCapacity)
        errors.cargoWeight = `Capacity exceeded by ${formatNumber(w - selectedVehicle.maxLoadCapacity)} kg.`;
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSmartDispatch = async () => {
    if (!validateStep(3)) return;

    setShowSmartDispatch(true);
    setSmartDispatchLoading(true);
    setSmartDispatchError(null);
    setSmartDispatchResponse(null);

    try {
      // Call Smart Dispatch service
      const input: SmartDispatchInput = {
        source: draft.source,
        destination: draft.destination,
        plannedDistance: Number(draft.plannedDistance),
        cargoWeight: Number(draft.cargoWeight),
      };

      const response = getSmartDispatchRecommendations(
        input,
        state.vehicles,
        state.drivers,
        TODAY
      );

      setSmartDispatchResponse(response);
    } catch (err) {
      setSmartDispatchError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setSmartDispatchLoading(false);
    }
  };

  const handleApplyRecommendation = (recommendation: any) => {
    // Apply vehicle and driver from recommendation
    setField('vehicleId', recommendation.vehicle.id);
    setField('driverId', recommendation.driver.id);
    setAppliedRecommendationScore(recommendation.score);
    setShowSmartDispatch(false);
    setSmartDispatchApplied(true);

    // Show feedback toast
    toast.success(
      `Recommendation applied\n${recommendation.vehicle.name} and ${recommendation.driver.name} selected.`,
      { duration: 3 }
    );
  };

  const next = () => { if (validateStep(step)) setStep(s => s + 1); };
  const back = () => setStep(s => Math.max(0, s - 1));

  const cargoWeight = Number(draft.cargoWeight) || 0;
  const cargoStepValid = Boolean(draft.cargoWeight && !isNaN(Number(draft.cargoWeight)) && Number(draft.cargoWeight) > 0);
  const capacityPct = selectedVehicle ? Math.min(100, (cargoWeight / selectedVehicle.maxLoadCapacity) * 100) : 0;
  const cargoValid = selectedVehicle ? cargoWeight <= selectedVehicle.maxLoadCapacity : true;

  const validations = useMemo((): ValidationItem[] => {
    const items: ValidationItem[] = [];
    if (!draft.vehicleId) {
      items.push({ id: 'v', label: 'Vehicle available', state: 'pending' });
    } else {
      const v = state.vehicles.find(veh => veh.id === draft.vehicleId);
      items.push({ id: 'v', label: 'Vehicle available', state: v?.status === 'AVAILABLE' ? 'pass' : 'fail', message: v?.status !== 'AVAILABLE' ? `${v?.name} is ${STATUS_META[v?.status ?? 'AVAILABLE'].label}` : undefined, actionLabel: 'Select another vehicle', onAction: () => setStep(1) });
    }
    if (!draft.driverId) {
      items.push({ id: 'd', label: 'Driver available', state: 'pending' });
      items.push({ id: 'dl', label: 'Driver licence valid', state: 'pending' });
    } else {
      const d = state.drivers.find(dr => dr.id === draft.driverId);
      items.push({ id: 'd', label: 'Driver available', state: d?.status === 'AVAILABLE' ? 'pass' : 'fail', message: d?.status !== 'AVAILABLE' ? `${d?.name} is ${STATUS_META[d?.status ?? 'AVAILABLE'].label}` : undefined, actionLabel: 'Select another driver', onAction: () => setStep(2) });
      const expired = d ? isExpired(d.licenseExpiryDate) : false;
      items.push({ id: 'dl', label: 'Driver licence valid', state: expired ? 'fail' : 'pass', message: expired ? `Licence expired ${formatDate(d?.licenseExpiryDate ?? '')}` : undefined, actionLabel: 'Select another driver', onAction: () => setStep(2) });
    }
    if (!draft.cargoWeight) {
      items.push({ id: 'c', label: 'Cargo within capacity', state: 'pending' });
    } else {
      items.push({ id: 'c', label: 'Cargo within capacity', state: cargoValid ? 'pass' : 'fail', message: !cargoValid && selectedVehicle ? `Exceeded by ${formatNumber(cargoWeight - selectedVehicle.maxLoadCapacity)} kg` : undefined, actionLabel: 'Edit cargo', onAction: () => setStep(3) });
    }
    return items;
  }, [draft, state, cargoValid, cargoWeight, selectedVehicle]);

  const allPass = validations.every(v => v.state === 'pass');
  const failCount = validations.filter(v => v.state === 'fail').length;

  const handleDispatch = () => {
    if (!allPass) return;
    const tripId = `TR-${1043 + state.trips.filter(t => t.status !== 'DRAFT').length}`;
    const trip: Trip = {
      id: tripId, source: draft.source, destination: draft.destination,
      vehicleId: draft.vehicleId, driverId: draft.driverId,
      cargoWeight, plannedDistance: Number(draft.plannedDistance),
      status: 'DISPATCHED', createdAt: new Date().toISOString(),
      dispatchedAt: new Date().toISOString(),
    };
    dispatch({ type: 'DISPATCH_TRIP', trip });
    setDispatched(trip);
  };

  // Dispatch success screen
  if (dispatched) {
    const v = state.vehicles.find(veh => veh.id === dispatched.vehicleId);
    const d = state.drivers.find(dr => dr.id === dispatched.driverId);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="max-w-md mx-auto pt-16 text-center">
        <div className="w-10 h-10 bg-emerald-400/15 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={20} className="text-emerald-400" />
        </div>
        <h2 className="text-lg font-semibold mb-1">{dispatched.id} dispatched</h2>
        <p className="text-sm text-muted-foreground mb-6">{dispatched.source} → {dispatched.destination}</p>
        <div className="border border-border rounded-md p-4 text-left space-y-3 mb-6">
          <StateTransition entity={v?.name} from="Available" to="On Trip" />
          <StateTransition entity={d?.name} from="Available" to="On Trip" />
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="secondary" onClick={() => navigate('trips')}>View trips</Button>
          <Button variant="primary" onClick={() => navigate('overview')}>Return to overview</Button>
        </div>
      </motion.div>
    );
  }

  // Smart Dispatch View
  if (showSmartDispatch) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              setShowSmartDispatch(false);
              setSmartDispatchResponse(null);
              setSmartDispatchError(null);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-[1.375rem] font-semibold">Smart Dispatch</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Finding the best vehicle and driver combination...</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <SmartDispatchPanel
            loading={smartDispatchLoading}
            response={smartDispatchResponse}
            error={smartDispatchError}
            onApplyRecommendation={handleApplyRecommendation}
            onRetry={handleSmartDispatch}
          />
        </div>
      </div>
    );
  }

  const eligibleVehicles = state.vehicles.filter(v => v.status === 'AVAILABLE');
  const eligibleDrivers = state.drivers.filter(d => d.status === 'AVAILABLE' && !isExpired(d.licenseExpiryDate));
  const ineligibleDrivers = state.drivers.filter(d => d.status !== 'AVAILABLE' || isExpired(d.licenseExpiryDate));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('trips')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-[1.375rem] font-semibold">Create Trip</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Configure and validate a transport dispatch.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold transition-colors',
                i < step ? 'bg-emerald-400/20 border border-emerald-400/40 text-emerald-400'
                  : i === step ? 'bg-primary/20 border border-primary/60 text-primary'
                    : 'bg-muted border border-border text-muted-foreground'
              )}>
                {i < step ? <Check size={10} /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-foreground' : 'text-muted-foreground')}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-px mx-2', i < step ? 'bg-emerald-400/30' : 'bg-border')} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main step content */}
        <div className="border border-border rounded-md p-6 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
          {/* Step 0: Route */}
          {step === 0 && (
            <motion.div key="step-0" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="space-y-4">
              <h3 className="text-sm font-semibold mb-4">Route details</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Source" placeholder="Chennai" value={draft.source} onChange={e => setField('source', e.target.value)} error={stepErrors.source} />
                <Input label="Destination" placeholder="Bengaluru" value={draft.destination} onChange={e => setField('destination', e.target.value)} error={stepErrors.destination} />
              </div>
              <Input label="Planned Distance (km)" type="number" placeholder="350" value={draft.plannedDistance} onChange={e => setField('plannedDistance', e.target.value)} error={stepErrors.plannedDistance} />
              <div className="flex justify-end pt-2">
                <Button variant="primary" icon={<ArrowRight size={13} />} onClick={next}>Continue to vehicle</Button>
              </div>
            </motion.div>
          )}

          {/* Step 1: Vehicle */}
          {step === 1 && (
            <motion.div key="step-1" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <h3 className="text-sm font-semibold mb-1">Select vehicle</h3>
              <p className="text-xs text-muted-foreground mb-4">Only available vehicles are shown.</p>
              {stepErrors.vehicleId && <p className="text-xs text-destructive mb-3">{stepErrors.vehicleId}</p>}
              {eligibleVehicles.length === 0
                ? <EmptyState title="No available vehicles" description="All vehicles are currently on trip or in maintenance." />
                : (
                  <div className="space-y-1">
                    {eligibleVehicles.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setField('vehicleId', v.id)}
                        className={cn(
                          'w-full text-left px-4 py-3 rounded border transition-colors flex items-center justify-between',
                          draft.vehicleId === v.id
                            ? 'bg-primary/5 border-primary/40'
                            : 'border-border hover:bg-accent/50'
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[0.8125rem] font-medium">{v.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{v.registrationNumber}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {v.type} · {formatNumber(v.maxLoadCapacity)} kg capacity · {formatNumber(v.odometer)} km
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={v.status} />
                          {draft.vehicleId === v.id && <Check size={14} className="text-primary" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              <div className="flex justify-between pt-4">
                <Button variant="ghost" icon={<ArrowLeft size={13} />} onClick={back}>Back</Button>
                <Button variant="primary" icon={<ArrowRight size={13} />} onClick={next}>Continue to driver</Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Driver */}
          {step === 2 && (
            <motion.div key="step-2" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
              <h3 className="text-sm font-semibold mb-1">Select driver</h3>
              <p className="text-xs text-muted-foreground mb-4">Only eligible drivers with valid licences are shown.</p>
              {stepErrors.driverId && <p className="text-xs text-destructive mb-3">{stepErrors.driverId}</p>}
              <div className="space-y-1 mb-4">
                {eligibleDrivers.map(d => (
                  <button
                    key={d.id}
                    onClick={() => setField('driverId', d.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded border transition-colors flex items-center justify-between',
                      draft.driverId === d.id ? 'bg-primary/5 border-primary/40' : 'border-border hover:bg-accent/50'
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.8125rem] font-medium">{d.name}</span>
                        <span className="text-xs text-muted-foreground">{d.licenseCategory}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Licence valid until {formatDate(d.licenseExpiryDate)} · Safety {d.safetyScore}/100
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={d.status} />
                      {draft.driverId === d.id && <Check size={14} className="text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
              {ineligibleDrivers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Unavailable drivers</p>
                  <div className="space-y-1">
                    {ineligibleDrivers.map(d => {
                      const reason = isExpired(d.licenseExpiryDate) ? `Licence expired ${formatDate(d.licenseExpiryDate)}`
                        : d.status === 'SUSPENDED' ? 'Driver is suspended'
                          : d.status === 'ON_TRIP' ? 'Currently on trip'
                            : d.status === 'OFF_DUTY' ? 'Off duty' : '';
                      return (
                        <div key={d.id} className="px-4 py-3 rounded border border-border bg-muted/30 flex items-center justify-between opacity-60">
                          <div>
                            <span className="text-[0.8125rem] font-medium">{d.name}</span>
                            <div className="text-xs text-muted-foreground mt-0.5">{reason}</div>
                          </div>
                          <StatusBadge status={d.status} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-4">
                <Button variant="ghost" icon={<ArrowLeft size={13} />} onClick={back}>Back</Button>
                <Button variant="primary" icon={<ArrowRight size={13} />} onClick={next}>Continue to cargo</Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Cargo */}
          {step === 3 && (
            <motion.div key="step-3" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="space-y-4">
              <h3 className="text-sm font-semibold">Cargo details</h3>
              {selectedVehicle && (
                <div className="p-3 bg-muted rounded border border-border text-xs text-muted-foreground">
                  Vehicle capacity: <span className="font-medium text-foreground tabular-nums">{formatNumber(selectedVehicle.maxLoadCapacity)} kg</span> — {selectedVehicle.name}
                </div>
              )}
              <Input
                label="Cargo Weight (kg)" type="number" placeholder="450"
                value={draft.cargoWeight} onChange={e => setField('cargoWeight', e.target.value)}
                error={stepErrors.cargoWeight}
              />
              {draft.cargoWeight && selectedVehicle && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatNumber(cargoWeight)} kg of {formatNumber(selectedVehicle.maxLoadCapacity)} kg</span>
                    <span className={cn('font-medium tabular-nums', cargoValid ? 'text-emerald-400' : 'text-red-400')}>
                      {Math.round(capacityPct)}% utilized
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', cargoValid ? 'bg-emerald-400' : 'bg-red-400')}
                      style={{ width: `${Math.min(100, capacityPct)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {cargoValid
                      ? <><CheckCircle2 size={13} className="text-emerald-400" /><span className="text-emerald-400">Cargo is within vehicle capacity.</span></>
                      : <><XCircle size={13} className="text-red-400" /><span className="text-red-400">Capacity exceeded by {formatNumber(cargoWeight - selectedVehicle.maxLoadCapacity)} kg.</span></>}
                  </div>
                </div>
              )}

              {/* Smart Dispatch Option - Show if cargo weight is valid */}
              {draft.cargoWeight && cargoStepValid && !selectedVehicle && (
                <div className="border border-border rounded-md p-4 bg-primary/5">
                  <h4 className="text-xs font-semibold text-foreground mb-1">Find the best dispatch</h4>
                  <p className="text-xs text-muted-foreground mb-3">Rank eligible vehicle and driver combinations for this trip.</p>
                  <Button 
                    variant="secondary" 
                    size="md" 
                    className="w-full"
                    loading={smartDispatchLoading}
                    onClick={handleSmartDispatch}
                  >
                    Find best dispatch
                  </Button>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button variant="ghost" icon={<ArrowLeft size={13} />} onClick={back}>Back</Button>
                <Button variant="primary" disabled={!cargoValid || !draft.cargoWeight} icon={<ArrowRight size={13} />} onClick={next}>Continue to review</Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <motion.div key="step-4" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2, ease: 'easeOut' }} className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-3">Trip details</h3>
                <DescriptionList items={[
                  { label: 'Route', value: `${draft.source} → ${draft.destination}` },
                  { label: 'Distance', value: `${formatNumber(Number(draft.plannedDistance))} km` },
                  { label: 'Vehicle', value: `${selectedVehicle?.name} · ${selectedVehicle?.registrationNumber}` },
                  { label: 'Driver', value: selectedDriver?.name ?? '—' },
                  { label: 'Cargo weight', value: `${formatNumber(cargoWeight)} kg` },
                ]} />
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-3">Dispatch validation</h3>
                <ValidationList items={validations} />
              </div>

              {smartDispatchApplied && appliedRecommendationScore !== null && (
                <div className="border border-border rounded-md p-3 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Smart Dispatch score</span>
                    <span className="text-lg font-semibold text-foreground">{appliedRecommendationScore} <span className="text-xs text-muted-foreground">/100</span></span>
                  </div>
                </div>
              )}

              {allPass ? (
                <div className="flex items-center gap-2 p-3 bg-emerald-400/8 border border-emerald-400/20 rounded text-xs text-emerald-400">
                  <CheckCircle2 size={13} />
                  All dispatch checks passed. Ready to dispatch.
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 bg-red-400/8 border border-red-400/20 rounded text-xs text-red-400">
                  <XCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <div>Dispatch blocked — {failCount} {failCount === 1 ? 'issue requires' : 'issues require'} attention.</div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="ghost" icon={<ArrowLeft size={13} />} onClick={back}>Back</Button>
                <Button variant="primary" disabled={!allPass} onClick={handleDispatch}>Dispatch trip</Button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Trip Summary Panel */}
        <div className="border border-border rounded-md p-4 h-fit">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Trip Summary</h3>
          <div className="space-y-4 text-[0.8125rem]">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Route</p>
              {draft.source && draft.destination ? (
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{draft.source}</span>
                  <span className="text-muted-foreground text-xs">↓</span>
                  <span className="font-medium">{draft.destination}</span>
                </div>
              ) : <span className="text-muted-foreground">Not selected</span>}
            </div>
            {draft.plannedDistance && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Distance</p>
                <span className="font-medium tabular-nums">{formatNumber(Number(draft.plannedDistance))} km</span>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Vehicle</p>
              {selectedVehicle
                ? <div><p className="font-medium">{selectedVehicle.name}</p><p className="text-xs text-muted-foreground font-mono">{selectedVehicle.registrationNumber}</p></div>
                : <span className="text-muted-foreground">Not selected</span>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Driver</p>
              {selectedDriver ? <span className="font-medium">{selectedDriver.name}</span> : <span className="text-muted-foreground">Not selected</span>}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Cargo</p>
              {draft.cargoWeight && selectedVehicle
                ? <span className="font-medium tabular-nums">{formatNumber(cargoWeight)} / {formatNumber(selectedVehicle.maxLoadCapacity)} kg</span>
                : <span className="text-muted-foreground">Not entered</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAINTENANCE PAGE
// ============================================================

function MaintenancePage() {
  const { state, dispatch, setDisruptions, setActiveRecoveryDisruption, setShowAutoRescueWorkspace } = useApp();
  const [tab, setTab] = useState('active');
  const [showCreate, setShowCreate] = useState(false);
  const [closeTarget, setCloseTarget] = useState<MaintenanceRecord | null>(null);

  const active = state.maintenance.filter(m => m.status === 'ACTIVE');
  const history = state.maintenance.filter(m => m.status === 'CLOSED');
  const current = tab === 'active' ? active : history;

  const getVehicleName = (id: string) => state.vehicles.find(v => v.id === id)?.name ?? id;

  const handleClose = () => {
    if (!closeTarget) return;
    dispatch({ type: 'CLOSE_MAINTENANCE', maintenanceId: closeTarget.id, vehicleId: closeTarget.vehicleId });
    const vehicle = state.vehicles.find(v => v.id === closeTarget.vehicleId);
    toast.success(`Maintenance closed — ${vehicle?.name ?? ''} returned to Available`);
    setCloseTarget(null);
  };

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Track vehicle maintenance and operational availability."
        action={<Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>New maintenance</Button>}
      />

      <Tabs
        tabs={[{ id: 'active', label: `Active Maintenance (${active.length})` }, { id: 'history', label: 'Maintenance History' }]}
        active={tab} onChange={setTab}
      />

      <div className="mt-4 border border-border rounded-md overflow-hidden">
        <table className="w-full text-[0.8125rem]">
          <thead>
            <tr className="border-b border-border bg-card">
              {['Vehicle', 'Type', 'Description', 'Cost', 'Start Date', tab === 'history' ? 'Closed' : 'Status', ''].map(col => (
                <th key={col} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {current.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState
                  title={tab === 'active' ? 'No active maintenance' : 'No maintenance history'}
                  description={tab === 'active' ? 'All fleet vehicles are currently outside maintenance.' : 'Closed maintenance records will appear here.'}
                />
              </td></tr>
            ) : current.map((m, idx) => (
              <AnimatedRow key={m.id} index={idx} className="hover:bg-accent/40 transition-colors">
                <td className="px-4 py-3 font-medium">{getVehicleName(m.vehicleId)}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.type}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{m.description}</td>
                <td className="px-4 py-3 tabular-nums text-right pr-4">{formatCurrencyFull(m.cost)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(m.startDate)}</td>
                <td className="px-4 py-3">
                  {tab === 'active'
                    ? <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Active</span>
                    : <span className="text-muted-foreground text-xs">{m.closedDate ? formatDate(m.closedDate) : '—'}</span>}
                </td>
                <td className="px-4 py-3">
                  {tab === 'active' && (
                    <Button size="sm" variant="secondary" onClick={() => setCloseTarget(m)}>Close</Button>
                  )}
                </td>
              </AnimatedRow>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Maintenance Drawer */}
      <CreateMaintenanceDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        vehicles={state.vehicles.filter(v => v.status !== 'RETIRED')}
        onSave={(record) => {
          dispatch({ type: 'CREATE_MAINTENANCE', record });
          const vehicle = state.vehicles.find(v => v.id === record.vehicleId);
          const disruption: DisruptionEvent = {
            id: uid(),
            type: 'VEHICLE_UNAVAILABLE',
            entityId: record.vehicleId,
            entityName: vehicle?.name ?? 'Vehicle',
            reason: `${vehicle?.name ?? 'Vehicle'} entered maintenance`,
            occurredAt: new Date().toISOString(),
          };
          setDisruptions(prev => [disruption, ...prev.filter(item => item.entityId !== record.vehicleId || item.type !== 'VEHICLE_UNAVAILABLE')]);
          setActiveRecoveryDisruption(disruption);
          setShowAutoRescueWorkspace(true);
          toast.success(`Maintenance created — ${vehicle?.name ?? ''} moved to In Shop`);
          setShowCreate(false);
        }}
      />

      {/* Close Confirmation */}
      <Modal
        open={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        title="Close maintenance?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCloseTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleClose}>Close maintenance</Button>
          </>
        }
      >
        {closeTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {getVehicleName(closeTarget.vehicleId)} will return to available fleet inventory.
            </p>
            <div className="p-3 bg-muted rounded border border-border">
              <StateTransition entity={getVehicleName(closeTarget.vehicleId)} from="In Shop" to="Available" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function CreateMaintenanceDrawer({
  open, onClose, vehicles, onSave,
}: { open: boolean; onClose: () => void; vehicles: Vehicle[]; onSave: (r: MaintenanceRecord) => void }) {
  const [form, setForm] = useState({ vehicleId: '', type: 'Scheduled Service', description: '', cost: '', startDate: TODAY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (f: string, v: string) => { setForm(p => ({ ...p, [f]: v })); setErrors(e => ({ ...e, [f]: '' })); };
  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!form.vehicleId) e.vehicleId = 'Select a vehicle.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.cost || isNaN(Number(form.cost))) e.cost = 'Enter a valid cost.';
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({
      id: uid(), vehicleId: form.vehicleId, type: form.type, description: form.description.trim(),
      cost: Number(form.cost), startDate: form.startDate, status: 'ACTIVE',
    });
    setForm({ vehicleId: '', type: 'Scheduled Service', description: '', cost: '', startDate: TODAY });
  };

  return (
    <Drawer open={open} onClose={onClose} title="New maintenance" subtitle="Create a maintenance record for a fleet vehicle"
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={handleSave}>Create maintenance</Button></div>}
    >
      <div className="space-y-4">
        <Select label="Vehicle" value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)}
          error={errors.vehicleId}
          options={[{ value: '', label: 'Select a vehicle…' }, ...vehicles.map(v => ({ value: v.id, label: `${v.name} — ${v.registrationNumber}` }))]} />

        {selectedVehicle && (
          <div className="flex gap-2 p-3 bg-amber-400/8 border border-amber-400/20 rounded text-xs">
            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 font-medium mb-0.5">Operational effect</p>
              <StateTransition entity={selectedVehicle.name} from={STATUS_META[selectedVehicle.status].label} to="In Shop" />
              <p className="text-muted-foreground mt-1">{selectedVehicle.name} will be removed from dispatch availability.</p>
            </div>
          </div>
        )}

        <Select label="Maintenance Type" value={form.type} onChange={e => set('type', e.target.value)}
          options={['Scheduled Service', 'Engine Repair', 'Tyre Replacement', 'Brake Service', 'Electrical', 'Other'].map(t => ({ value: t, label: t }))} />
        <Textarea label="Description" placeholder="Describe the maintenance work required…" value={form.description} onChange={e => set('description', e.target.value)} error={errors.description} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Cost (₹)" type="number" placeholder="12000" value={form.cost} onChange={e => set('cost', e.target.value)} error={errors.cost} />
          <Input label="Start Date" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </div>
      </div>
    </Drawer>
  );
}

// ============================================================
// EXPENSES PAGE
// ============================================================

function ExpensesPage() {
  const { state, dispatch } = useApp();
  const tooltipStyle = useTooltipStyle();
  const tickStyle = useAxisTickStyle();
  const [tab, setTab] = useState('fuel');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [showAddFuel, setShowAddFuel] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const getVehicleName = (id: string) => state.vehicles.find(v => v.id === id)?.name ?? id;

  const filteredFuel = useMemo(() =>
    state.fuelLogs.filter(f => !vehicleFilter || f.vehicleId === vehicleFilter)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [state.fuelLogs, vehicleFilter]
  );

  const filteredExpenses = useMemo(() =>
    state.expenses.sort((a, b) => b.date.localeCompare(a.date)),
    [state.expenses]
  );

  const totalCost = state.expenses.reduce((s, e) => s + e.amount, 0);
  const totalFuelCost = state.fuelLogs.reduce((s, f) => s + f.cost, 0);

  // Fuel efficiency chart data
  const fuelByVehicle = state.vehicles
    .map(v => ({ name: v.name, efficiency: state.fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.efficiency, 0) / (state.fuelLogs.filter(f => f.vehicleId === v.id).length || 1) }))
    .filter(v => state.fuelLogs.some(f => f.vehicleId === state.vehicles.find(veh => veh.name === v.name)?.id));

  const efficiencyTrend = filteredFuel.slice().reverse().map((f, i) => ({ i: i + 1, eff: f.efficiency }));

  return (
    <div>
      <PageHeader
        title="Fuel & Expenses"
        description="Track fleet fuel consumption and operational spending."
        action={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => tab === 'fuel' ? setShowAddFuel(true) : setShowAddExpense(true)}>
            {tab === 'fuel' ? 'Add fuel log' : 'Add expense'}
          </Button>
        }
      />

      <Tabs tabs={[{ id: 'fuel', label: 'Fuel Logs' }, { id: 'expenses', label: 'Other Expenses' }]} active={tab} onChange={setTab} />

      <div className="mt-4">
        {tab === 'fuel' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-input-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">All vehicles</option>
                {state.vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>

            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-border bg-card">
                    {['Date', 'Vehicle', 'Fuel (L)', 'Cost', 'Odometer', 'Efficiency'].map(col => (
                      <th key={col} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFuel.length === 0
                    ? <tr><td colSpan={6}><EmptyState title="No fuel logs" description="Fuel logs will appear here." /></td></tr>
                    : filteredFuel.map((f, idx) => (
                      <AnimatedRow key={f.id} index={idx} className="hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(f.date)}</td>
                        <td className="px-4 py-3 font-medium">{getVehicleName(f.vehicleId)}</td>
                        <td className="px-4 py-3 tabular-nums text-right pr-4">{f.liters.toFixed(1)}</td>
                        <td className="px-4 py-3 tabular-nums text-right pr-4">{formatCurrencyFull(f.cost)}</td>
                        <td className="px-4 py-3 tabular-nums text-right pr-4">{formatNumber(f.odometer)} km</td>
                        <td className="px-4 py-3 tabular-nums text-right pr-4">{f.efficiency.toFixed(2)} km/L</td>
                      </AnimatedRow>
                    ))}
                </tbody>
              </table>
            </div>

            {efficiencyTrend.length > 1 && (
              <div className="border border-border rounded-md p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Fuel Efficiency Trend</h3>
                  <span className="text-xs text-muted-foreground">km/L</span>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={efficiencyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="i" tick={tickStyle} />
                    <YAxis tick={tickStyle} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [`${v.toFixed(2)} km/L`, 'Efficiency']}
                    />
                    <Line type="monotone" dataKey="eff" stroke="#d97706" strokeWidth={1.5} dot={{ r: 2, fill: '#d97706' }} activeDot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {tab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-md bg-card">
              <p className="text-xs text-muted-foreground">Total Operational Cost</p>
              <p className="text-lg font-semibold tabular-nums">{formatCurrencyFull(totalCost + totalFuelCost)}</p>
            </div>

            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-border bg-card">
                    {['Date', 'Vehicle', 'Category', 'Description', 'Amount'].map(col => (
                      <th key={col} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredExpenses.length === 0
                    ? <tr><td colSpan={5}><EmptyState title="No expenses" description="Operational expenses will appear here." /></td></tr>
                    : filteredExpenses.map((e, idx) => (
                      <AnimatedRow key={e.id} index={idx} className="hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(e.date)}</td>
                        <td className="px-4 py-3 font-medium">{getVehicleName(e.vehicleId)}</td>
                        <td className="px-4 py-3">
                          <span className={cn('text-xs px-1.5 py-0.5 rounded',
                            e.category === 'Toll' ? 'bg-blue-400/10 text-blue-400'
                              : e.category === 'Maintenance' ? 'bg-amber-400/10 text-amber-400'
                                : 'bg-muted text-muted-foreground'
                          )}>{e.category}</span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{e.description}</td>
                        <td className="px-4 py-3 tabular-nums text-right pr-4 font-medium">{formatCurrencyFull(e.amount)}</td>
                      </AnimatedRow>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Fuel Log Modal */}
      <AddFuelLogModal
        open={showAddFuel}
        onClose={() => setShowAddFuel(false)}
        vehicles={state.vehicles}
        onSave={(log) => { dispatch({ type: 'ADD_FUEL_LOG', log }); setShowAddFuel(false); toast.success('Fuel log recorded'); }}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        vehicles={state.vehicles}
        onSave={(expense) => { dispatch({ type: 'ADD_EXPENSE', expense }); setShowAddExpense(false); toast.success('Expense recorded'); }}
      />
    </div>
  );
}

function AddFuelLogModal({ open, onClose, vehicles, onSave }: { open: boolean; onClose: () => void; vehicles: Vehicle[]; onSave: (l: FuelLog) => void }) {
  const [form, setForm] = useState({ vehicleId: '', liters: '', cost: '', odometer: '', date: TODAY });
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));
  const efficiency = form.liters && form.odometer ? 0 : 0;

  const handleSave = () => {
    const liters = Number(form.liters);
    const cost = Number(form.cost);
    const odometer = Number(form.odometer);
    if (!form.vehicleId || !liters || !cost || !odometer) return;
    const eff = liters > 0 ? (odometer / liters) : 0;
    onSave({ id: uid(), vehicleId: form.vehicleId, liters, cost, date: form.date, odometer, efficiency: parseFloat(eff.toFixed(2)) });
    setForm({ vehicleId: '', liters: '', cost: '', odometer: '', date: TODAY });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add fuel log"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={handleSave}>Save log</Button></>}
    >
      <div className="space-y-3">
        <Select label="Vehicle" value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)}
          options={[{ value: '', label: 'Select vehicle…' }, ...vehicles.map(v => ({ value: v.id, label: v.name }))]} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Fuel (L)" type="number" placeholder="40.0" value={form.liters} onChange={e => set('liters', e.target.value)} />
          <Input label="Cost (₹)" type="number" placeholder="4200" value={form.cost} onChange={e => set('cost', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Odometer (km)" type="number" placeholder="84230" value={form.odometer} onChange={e => set('odometer', e.target.value)} />
          <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function AddExpenseModal({ open, onClose, vehicles, onSave }: { open: boolean; onClose: () => void; vehicles: Vehicle[]; onSave: (e: Expense) => void }) {
  const [form, setForm] = useState({ vehicleId: '', category: 'Toll' as ExpenseCategory, description: '', amount: '', date: TODAY });
  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSave = () => {
    if (!form.vehicleId || !form.description || !form.amount) return;
    onSave({ id: uid(), vehicleId: form.vehicleId, category: form.category as ExpenseCategory, description: form.description, amount: Number(form.amount), date: form.date });
    setForm({ vehicleId: '', category: 'Toll', description: '', amount: '', date: TODAY });
  };

  return (
    <Modal open={open} onClose={onClose} title="Add expense"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={handleSave}>Save expense</Button></>}
    >
      <div className="space-y-3">
        <Select label="Vehicle" value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)}
          options={[{ value: '', label: 'Select vehicle…' }, ...vehicles.map(v => ({ value: v.id, label: v.name }))]} />
        <Select label="Category" value={form.category} onChange={e => set('category', e.target.value)}
          options={(['Toll', 'Maintenance', 'Other'] as ExpenseCategory[]).map(c => ({ value: c, label: c }))} />
        <Input label="Description" placeholder="Describe the expense" value={form.description} onChange={e => set('description', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount (₹)" type="number" value={form.amount} onChange={e => set('amount', e.target.value)} />
          <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

// ============================================================
// REPORTS PAGE
// ============================================================

function ReportsPage() {
  const { state } = useApp();
  const tooltipStyle = useTooltipStyle();
  const tickStyle = useAxisTickStyle();

  const exportReports = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Trips', String(state.trips.length)],
      ['Fleet Utilization', `${Math.round((state.vehicles.filter(v => v.status === 'ON_TRIP').length / state.vehicles.length) * 100)}%`],
      ['Operational Cost', formatCurrency(state.fuelLogs.reduce((s, f) => s + f.cost, 0) + state.maintenance.reduce((s, m) => s + m.cost, 0) + state.expenses.reduce((s, e) => s + e.amount, 0))],
      ['Avg Fuel Efficiency', `${state.fuelLogs.length ? (state.fuelLogs.reduce((s, f) => s + f.efficiency, 0) / state.fuelLogs.length).toFixed(2) : '—'} km/L`],
      ['Available Vehicles', String(state.vehicles.filter(v => v.status === 'AVAILABLE').length)],
      ['Vehicles on Trip', String(state.vehicles.filter(v => v.status === 'ON_TRIP').length)],
      ['Vehicles in Shop', String(state.vehicles.filter(v => v.status === 'IN_SHOP').length)],
      ['Retired Vehicles', String(state.vehicles.filter(v => v.status === 'RETIRED').length)],
    ];

    const csvContent = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fleet-reports.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fleetUtilizationData = [
    { month: 'Feb', util: 58 }, { month: 'Mar', util: 62 }, { month: 'Apr', util: 55 },
    { month: 'May', util: 70 }, { month: 'Jun', util: 65 }, { month: 'Jul', util: 67 },
  ];

  const costDistribution = [
    { name: 'Fuel', value: state.fuelLogs.reduce((s, f) => s + f.cost, 0), color: '#d97706' },
    { name: 'Maintenance', value: state.maintenance.reduce((s, m) => s + m.cost, 0), color: '#60a5fa' },
    { name: 'Other', value: state.expenses.reduce((s, e) => s + e.amount, 0), color: '#34d399' },
  ];

  const vehicleROI = state.vehicles.filter(v => v.status !== 'RETIRED').map(v => ({
    name: v.name,
    roi: Math.round((state.trips.filter(t => t.vehicleId === v.id && t.status === 'COMPLETED').length * 8500 - (state.fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0) + state.maintenance.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0))) / v.acquisitionCost * 100),
  })).sort((a, b) => b.roi - a.roi);

  const avgEfficiency = state.fuelLogs.length
    ? (state.fuelLogs.reduce((s, f) => s + f.efficiency, 0) / state.fuelLogs.length).toFixed(2)
    : '—';

  const totalCost = costDistribution.reduce((s, c) => s + c.value, 0);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Analyse fleet efficiency and operational cost."
        action={<Button variant="secondary" icon={<Download size={14} />} onClick={exportReports}>Export</Button>}
      />

      <MetricStrip metrics={[
        { label: 'Total Trips', value: state.trips.length },
        { label: 'Fleet Utilization', value: `${Math.round((state.vehicles.filter(v => v.status === 'ON_TRIP').length / state.vehicles.length) * 100)}%` },
        { label: 'Operational Cost', value: formatCurrency(totalCost) },
        { label: 'Avg Fuel Efficiency', value: `${avgEfficiency} km/L` },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Fleet Utilization Over Time */}
        <div className="border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold mb-4">Fleet Utilization Over Time</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={fleetUtilizationData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={tickStyle} />
              <YAxis tick={tickStyle} unit="%" domain={[40, 80]} />
              <Tooltip contentStyle={tooltipStyle}
                formatter={(v: number) => [`${v}%`, 'Utilization']} />
              <Line type="monotone" dataKey="util" stroke="#d97706" strokeWidth={1.5} dot={{ r: 2, fill: '#d97706' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Distribution */}
        <div className="border border-border rounded-md p-4">
          <h3 className="text-sm font-semibold mb-4">Cost Distribution</h3>
          <div className="flex items-center gap-6">
            <PieChart width={140} height={140}>
              <Pie data={costDistribution} cx="50%" cy="50%" innerRadius={42} outerRadius={65} paddingAngle={2} dataKey="value">
                {costDistribution.map(d => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle}
                formatter={(v: number) => [formatCurrencyFull(v)]} />
            </PieChart>
            <ul className="space-y-2 flex-1">
              {costDistribution.map(d => (
                <li key={d.name} className="flex items-center justify-between text-[0.8125rem]">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-medium tabular-nums">{formatCurrency(d.value)}</span>
                </li>
              ))}
              <li className="flex items-center justify-between text-[0.8125rem] pt-1 border-t border-border">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold tabular-nums">{formatCurrency(totalCost)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Vehicle ROI */}
      <div className="border border-border rounded-md p-4 mt-6">
        <h3 className="text-sm font-semibold mb-4">Vehicle ROI</h3>
        <ResponsiveContainer width="100%" height={vehicleROI.length * 36 + 20}>
          <BarChart data={vehicleROI} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
            <XAxis type="number" tick={tickStyle} unit="%" />
            <YAxis type="category" dataKey="name" tick={tickStyle} width={70} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={(v: number) => [`${v}%`, 'ROI']} />
            <Bar dataKey="roi" fill="#d97706" radius={[0, 2, 2, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS PAGE
// ============================================================

const ROLES = ['Fleet Manager', 'Dispatch User', 'Safety Officer', 'Financial Analyst'];
const MODULES = ['Dashboard', 'Vehicles', 'Drivers', 'Trips', 'Maintenance', 'Fuel & Expenses', 'Reports', 'Settings'];

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  'Fleet Manager':     { Dashboard: true, Vehicles: true, Drivers: true, Trips: true, Maintenance: true, 'Fuel & Expenses': true, Reports: true, Settings: true },
  'Dispatch User':     { Dashboard: true, Vehicles: true, Drivers: true, Trips: true, Maintenance: false, 'Fuel & Expenses': false, Reports: false, Settings: false },
  'Safety Officer':    { Dashboard: true, Vehicles: true, Drivers: true, Trips: false, Maintenance: true, 'Fuel & Expenses': false, Reports: true, Settings: false },
  'Financial Analyst': { Dashboard: true, Vehicles: false, Drivers: false, Trips: false, Maintenance: true, 'Fuel & Expenses': true, Reports: true, Settings: false },
};

function SettingsPage() {
  const [tab, setTab] = useState('general');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [dirty, setDirty] = useState(false);

  const toggle = (role: string, module: string) => {
    setPermissions(p => ({ ...p, [role]: { ...p[role], [module]: !p[role][module] } }));
    setDirty(true);
  };

  const save = () => { setDirty(false); toast.success('Permissions saved'); };
  const discard = () => { setPermissions(DEFAULT_PERMISSIONS); setDirty(false); };

  return (
    <div>
      <PageHeader title="Settings" />

      <Tabs tabs={[{ id: 'general', label: 'General' }, { id: 'roles', label: 'Roles & Permissions' }, { id: 'users', label: 'Users' }]} active={tab} onChange={setTab} />

      <div className="mt-6">
        {tab === 'general' && (
          <div className="max-w-lg space-y-6">
            <div className="border border-border rounded-md p-4 space-y-4">
              <h3 className="text-sm font-semibold">Organization</h3>
              <Input label="Organization Name" defaultValue="Chennai Freight Services Pvt. Ltd." />
              <Input label="Fleet Identifier Prefix" defaultValue="CFS" />
              <Input label="Primary Contact Email" defaultValue="ops@cfsfreight.in" />
            </div>
            <div className="border border-border rounded-md p-4 space-y-4">
              <h3 className="text-sm font-semibold">Notifications</h3>
              {['Licence expiry alerts (30 days)', 'Maintenance status changes', 'Trip dispatch confirmations'].map(label => (
                <label key={label} className="flex items-center justify-between cursor-pointer">
                  <span className="text-[0.8125rem] text-muted-foreground">{label}</span>
                  <input type="checkbox" defaultChecked className="rounded border-border" />
                </label>
              ))}
            </div>
            <Button variant="primary">Save changes</Button>
          </div>
        )}

        {tab === 'roles' && (
          <div>
            <div className="border border-border rounded-md overflow-auto">
              <table className="w-full text-[0.8125rem]">
                <thead>
                  <tr className="border-b border-border bg-card">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground w-36">Module</th>
                    {ROLES.map(r => (
                      <th key={r} className="text-center px-4 py-2.5 text-xs font-medium text-muted-foreground">{r}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {MODULES.map(module => (
                    <tr key={module} className="hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{module}</td>
                      {ROLES.map(role => (
                        <td key={role} className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggle(role, module)}
                            className={cn('w-7 h-7 rounded flex items-center justify-center mx-auto transition-colors',
                              permissions[role][module]
                                ? 'bg-emerald-400/15 text-emerald-400 hover:bg-emerald-400/25'
                                : 'bg-muted text-muted-foreground/40 hover:bg-muted/80'
                            )}
                            aria-label={`Toggle ${module} for ${role}`}
                          >
                            {permissions[role][module] ? <Check size={12} /> : <Minus size={12} />}
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dirty && (
              <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card px-6 py-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Unsaved permission changes</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={discard}>Discard</Button>
                  <Button variant="primary" size="sm" onClick={save}>Save changes</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'users' && (
          <div>
            <UsersTab />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ROUTER + APP ROOT
// ============================================================

function Router() {
  const { route, isAuthenticated, authLoading, activeRecoveryDisruption, showAutoRescueWorkspace, setShowAutoRescueWorkspace, setActiveRecoveryDisruption } = useApp();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading your workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || route === 'login') return <LoginPage />;

  return (
    <>
      <AppShell>
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {route === 'overview' && <OverviewPage />}
            {route === 'profile' && <ProfilePage />}
            {route === 'vehicles' && <VehiclesPage />}
            {route === 'drivers' && <DriversPage />}
            {route === 'trips' && <TripsPage />}
            {route === 'trips-new' && <TripDispatcherPage />}
            {route === 'maintenance' && <MaintenancePage />}
            {route === 'expenses' && <ExpensesPage />}
            {route === 'reports' && <ReportsPage />}
            {route === 'settings' && <SettingsPage />}
          </motion.div>
        </AnimatePresence>
      </AppShell>
      {showAutoRescueWorkspace && activeRecoveryDisruption && (
        <div className="fixed inset-0 z-[70] bg-black/60 p-3 md:p-6">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">AutoRescue Plan</p>
                <p className="text-xs text-muted-foreground">Operational recovery workspace</p>
              </div>
              <button onClick={() => { setShowAutoRescueWorkspace(false); setActiveRecoveryDisruption(null); }} className="rounded border border-border px-3 py-1.5 text-xs text-foreground hover:bg-accent">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <AutoRescuePlanPage
                disruption={activeRecoveryDisruption}
                onClose={() => { setShowAutoRescueWorkspace(false); setActiveRecoveryDisruption(null); }}
                onApplied={() => { setShowAutoRescueWorkspace(false); setActiveRecoveryDisruption(null); }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, INIT_STATE);
  const [route, setRoute] = useState<Route>('login');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [disruptions, setDisruptions] = useState<DisruptionEvent[]>([]);
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryHistoryEntry[]>([]);
  const [activeRecoveryDisruption, setActiveRecoveryDisruption] = useState<DisruptionEvent | null>(null);
  const [showAutoRescueWorkspace, setShowAutoRescueWorkspace] = useState(false);

  const navigate = useCallback((r: Route) => {
    setRoute(r);
    setSidebarOpen(false);
  }, []);

  const login = useCallback((nextUser: AuthenticatedUser) => {
    const normalizedUser: AuthenticatedUser = {
      ...nextUser,
      name: nextUser.name || nextUser.email || 'User',
      role: normalizeRole(nextUser.role),
      fullName: nextUser.fullName || nextUser.name || nextUser.email || 'User',
    } as AuthenticatedUser;
    setUser(normalizedUser);
    setIsAuthenticated(true);
    setRoute('overview');
    setSidebarOpen(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout errors and fall back to local UI state
    }
    setUser(null);
    setIsAuthenticated(false);
    setRoute('login');
    setSidebarOpen(false);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(d => {
      const next = !d;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      try {
        const existingUser = await authService.getCurrentUser();
        if (!active) return;

        if (existingUser) {
          const normalizedUser: AuthenticatedUser = {
            ...existingUser,
            name: existingUser.name || existingUser.email || 'User',
            role: normalizeRole(existingUser.role),
            fullName: (existingUser as any).fullName || existingUser.name || existingUser.email || 'User',
          } as AuthenticatedUser;
          setUser(normalizedUser);
          setIsAuthenticated(true);
          setRoute('overview');
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setRoute('login');
        }
      } catch {
        if (active) {
          setUser(null);
          setIsAuthenticated(false);
          setRoute('login');
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch, route, navigate, sidebarOpen, setSidebarOpen, darkMode, toggleDarkMode, user, isAuthenticated, authLoading, login, logout, disruptions, setDisruptions, recoveryHistory, setRecoveryHistory, activeRecoveryDisruption, setActiveRecoveryDisruption, showAutoRescueWorkspace, setShowAutoRescueWorkspace }}>
      <Router />
      <Toaster
        position="bottom-right"
        theme={darkMode ? 'dark' : 'light'}
        toastOptions={{ style: { fontSize: '13px' } }}
      />
    </AppContext.Provider>
  );
}
