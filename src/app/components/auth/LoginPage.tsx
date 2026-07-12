import React, { useState } from 'react';
import { Route, Users, Shield, BarChart3, Eye, EyeOff, AlertCircle } from 'lucide-react';
import BrandLogo from '../ui/BrandLogo';
import { authService, isMockMode } from '../../../services/authService';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const validateEmail = (val: string) => {
    if (!val) return 'Email address is required.';
    if (!/\S+@\S+\.\S+/.test(val)) return 'Enter a valid email address.';
    return '';
  };

  const handleDemoClick = (demoEmail: string) => {
    if (loading) return;
    setEmail(demoEmail);
    setPassword('transitops2026');
    setEmailError('');
    setPasswordError('');
    setFormError('');
    setErrorDetails('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const emailErr = validateEmail(email);
    const passErr = !password ? 'Password is required.' : '';

    setEmailError(emailErr);
    setPasswordError(passErr);
    setFormError('');
    setErrorDetails('');

    if (emailErr || passErr) return;

    setLoading(true);
    try {
      const user = await authService.login(email, password);
      onLoginSuccess(user);
    } catch (err: any) {
      if (err.message === 'ACCOUNT_INACTIVE') {
        setFormError('Account inactive');
        setErrorDetails('Your account is currently inactive. Contact your fleet administrator.');
      } else if (err.message === 'ACCOUNT_SUSPENDED') {
        setFormError('Account suspended');
        setErrorDetails('Access to this account has been suspended. Contact your fleet administrator.');
      } else {
        setFormError('Unable to sign in');
        setErrorDetails('The email address or password is incorrect.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background text-foreground select-none">
      {/* Left panel - 42% on desktop, 35% on tablet, hidden on mobile */}
      <div className="hidden md:flex flex-col justify-between w-[42%] bg-[#0b0d13] dark:bg-[#090b10] border-r border-border p-10 flex-shrink-0 text-zinc-100">
        {/* Top brand */}
<BrandLogo showText={true} textClassName="text-white" />

        {/* Center content */}
        <div className="my-auto py-12 max-w-sm">
          <div className="mb-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Platform Entry</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-white mb-3">
            Fleet operations,<br />under control.
          </h1>
          <p className="text-[0.8125rem] text-zinc-400 mb-8 leading-relaxed">
            Manage vehicles, dispatch operations, driver compliance, maintenance, and fleet performance from one operational workspace.
          </p>

          <ul className="space-y-4">
            {[
              { icon: <Truck size={15} />, label: 'Fleet operations' },
              { icon: <Route size={15} />, label: 'Trip dispatch' },
              { icon: <Shield size={15} />, label: 'Driver compliance' },
              { icon: <BarChart3 size={15} />, label: 'Operational reporting' },
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="text-primary flex-shrink-0">{item.icon}</span>
                <span className="font-medium text-[0.8125rem]">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer brand */}
        <div className="flex flex-col gap-0.5 border-t border-zinc-800/50 pt-4">
          <span className="text-xs font-semibold text-zinc-300">TransitOps</span>
          <span className="text-[10px] text-zinc-500">Smart Transport Operations Platform</span>
        </div>
      </div>

      {/* Right panel - 58% on desktop, centered form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[390px] flex flex-col gap-6">
          {/* Mobile view Logo/Brand */}
          <div className="flex flex-col gap-2 md:hidden mb-2">
            <BrandLogo showText={true} textClassName="text-foreground" />
            <p className="text-xs text-muted-foreground">Fleet operations, under control.</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-xs text-muted-foreground mt-1">Sign in to continue to TransitOps.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form-level errors */}
            {formError && (
              <div className="flex items-start gap-2.5 text-xs bg-destructive/5 border border-destructive/20 text-destructive rounded-md px-3.5 py-3" role="alert">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0 text-red-500" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{formError}</span>
                  <span className="text-muted-foreground">{errorDetails}</span>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-email" className="text-xs font-medium text-muted-foreground">Email address</label>
              <input
                id="login-email"
                type="text"
                placeholder="name@company.com"
                value={email}
                disabled={loading}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                className={`w-full px-3 py-2 rounded-md bg-input-background border text-[0.8125rem] text-foreground transition-all duration-200 outline-none
                  ${emailError ? 'border-destructive focus:ring-destructive/30' : 'border-border focus:ring-primary/20 focus:border-primary'}
                  focus:ring-[3px]`}
                autoComplete="email"
                aria-invalid={!!emailError}
              />
              {emailError && <p className="text-xs text-destructive mt-0.5">{emailError}</p>}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1">
              <label htmlFor="login-password" className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative w-full">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  disabled={loading}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  className={`w-full pl-3 pr-10 py-2 rounded-md bg-input-background border text-[0.8125rem] text-foreground transition-all duration-200 outline-none
                    ${passwordError ? 'border-destructive focus:ring-destructive/30' : 'border-border focus:ring-primary/20 focus:border-primary'}
                    focus:ring-[3px]`}
                  autoComplete="current-password"
                  aria-invalid={!!passwordError}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordError && <p className="text-xs text-destructive mt-0.5">{passwordError}</p>}
            </div>

            {/* Options */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={loading}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border bg-input-background accent-primary text-primary focus:ring-ring focus:ring-offset-0 focus:ring-1"
                />
                Remember me
              </label>
              <button
                type="button"
                className="text-xs text-primary hover:underline font-medium bg-transparent border-0 cursor-pointer p-0"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-9 bg-primary text-primary-foreground font-semibold text-[0.8125rem] rounded-md transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-primary/45 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo Access section if mock auth is active */}
          {isMockMode && (
            <div className="mt-4 border-t border-border pt-4 flex flex-col gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Demo Access</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {[
                  { label: 'Fleet Manager', email: 'fleet.manager@transitops.in' },
                  { label: 'Driver', email: 'driver@transitops.in' },
                  { label: 'Financial Analyst', email: 'finance@transitops.in' },
                  { label: 'Safety Officer', email: 'safety@transitops.in' },
                ].map((demo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDemoClick(demo.email)}
                    className="flex flex-col text-left p-2 rounded bg-muted/40 border border-border/50 hover:bg-muted transition-colors w-full"
                  >
                    <span className="font-semibold text-foreground">{demo.label}</span>
                    <span className="text-muted-foreground truncate">{demo.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
