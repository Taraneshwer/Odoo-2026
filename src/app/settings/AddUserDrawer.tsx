import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

// ============================================================
// UI PRIMITIVES (MATCHING APP.TSX)
// ============================================================

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
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
            className={`flex flex-col bg-card border-l border-border h-full shadow-2xl ${width}`}
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

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground">{label}</label>}
      <input
        id={inputId}
        className={`w-full px-3 py-1.5 rounded bg-input-background border border-border text-foreground text-[0.8125rem]
          placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500
          ${error ? 'border-destructive/60 focus:ring-destructive/40' : ''}
          ${className || ''}`}
        {...props}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && <label htmlFor={selectId} className="text-xs font-medium text-muted-foreground">{label}</label>}
      <select
        id={selectId}
        className={`w-full px-3 py-1.5 rounded bg-input-background border border-border text-foreground text-[0.8125rem]
          focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500
          ${error ? 'border-destructive/60' : ''}
          ${className || ''}`}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ============================================================
// MAIN DRAWER COMPONENT
// ============================================================

interface AddUserDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (userData: any) => Promise<void>;
  userToEdit?: any;
}

export default function AddUserDrawer({ open, onClose, onSave, userToEdit }: AddUserDrawerProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('fleet_manager');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (userToEdit) {
        setFullName(userToEdit.fullName || userToEdit.full_name || '');
        setEmail(userToEdit.email || '');
        setPhone(userToEdit.phone || '');
        // Normalize role for selection
        let initialRole = userToEdit.role || 'fleet_manager';
        if (initialRole === 'FLEET_MANAGER') initialRole = 'fleet_manager';
        else if (initialRole === 'DRIVER') initialRole = 'driver';
        else if (initialRole === 'SAFETY_OFFICER') initialRole = 'safety_officer';
        else if (initialRole === 'FINANCIAL_ANALYST') initialRole = 'financial_analyst';
        else if (initialRole === 'ADMIN') initialRole = 'admin';
        setRole(initialRole.toLowerCase());
        setIsActive(userToEdit.isActive !== undefined ? userToEdit.isActive : (userToEdit.is_active !== undefined ? userToEdit.is_active : true));
        setPassword('');
      } else {
        setFullName('');
        setEmail('');
        setPhone('');
        setRole('fleet_manager');
        setIsActive(true);
        setPassword('');
      }
      setErrors({});
    }
  }, [open, userToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Validation
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!userToEdit && !password) {
      newErrors.password = 'Password is required for new users.';
    } else if (!userToEdit && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        email: email.trim(),
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        role: role,
      };

      if (userToEdit) {
        payload.id = userToEdit.id;
        payload.is_active = isActive;
        if (password) {
          payload.password = password;
        }
      } else {
        payload.password = password;
      }

      await onSave(payload);
      toast.success(userToEdit ? 'User updated successfully' : 'User registered successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while saving the user');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'fleet_manager', label: 'Fleet Manager' },
    { value: 'driver', label: 'Driver' },
    { value: 'safety_officer', label: 'Safety Officer' },
    { value: 'financial_analyst', label: 'Financial Analyst' },
    { value: 'admin', label: 'System Admin' },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={userToEdit ? 'Edit User' : 'Register User'}
      subtitle={userToEdit ? 'Modify user role or properties' : 'Create a new user account'}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded bg-muted hover:bg-muted/80 text-foreground transition-all"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white transition-all disabled:opacity-50"
          >
            {loading && <Loader2 size={13} className="animate-spin" />}
            {userToEdit ? 'Save changes' : 'Register user'}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Alex Kumar"
          value={fullName}
          onChange={e => { setFullName(e.target.value); setErrors(p => ({ ...p, fullName: '' })); }}
          error={errors.fullName}
          disabled={loading}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
          error={errors.email}
          disabled={loading}
        />

        <Input
          label={userToEdit ? 'Password (Leave blank to keep unchanged)' : 'Password'}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
          error={errors.password}
          disabled={loading}
        />

        <Input
          label="Contact Number (Optional)"
          placeholder="+91 98400 12345"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          disabled={loading}
        />

        <Select
          label="Role"
          value={role}
          onChange={e => setRole(e.target.value)}
          options={roleOptions}
          disabled={loading}
        />

        {userToEdit && (
          <div className="flex items-center justify-between border border-border p-3 rounded bg-card mt-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-[0.8125rem] font-semibold text-foreground">User Status</span>
              <span className="text-xs text-muted-foreground">Toggle to active or deactivate this account</span>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              disabled={loading}
              className="w-4 h-4 rounded border-border bg-input-background accent-amber-600 text-amber-600 focus:ring-ring focus:ring-offset-0 focus:ring-1"
            />
          </div>
        )}
      </form>
    </Drawer>
  );
}
