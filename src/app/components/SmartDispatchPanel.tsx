import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown, Check, AlertTriangle, Sparkles, ArrowRight,
  Loader2, AlertCircle, Eye, EyeOff,
} from 'lucide-react';
import {
  DispatchRecommendation,
  ExcludedResource,
  SmartDispatchResponse,
} from '../services/smartDispatchService';

// ============================================================
// BUTTON (Reused from main app)
// ============================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: React.ReactNode;
}

function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center gap-1.5 font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-amber-600',
    secondary: 'bg-card border border-border text-foreground hover:bg-accent',
    ghost: 'text-muted-foreground hover:text-foreground hover:bg-accent',
    danger: 'bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20',
  };
  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-[0.8125rem]',
  };

  return (
    <button
      className={
        `${base} ${variants[variant]} ${sizes[size]} ` +
        (className || '')
      }
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ============================================================
// SMART DISPATCH PANEL
// ============================================================

interface SmartDispatchPanelProps {
  loading: boolean;
  response: SmartDispatchResponse | null;
  error: string | null;
  onApplyRecommendation: (recommendation: DispatchRecommendation) => void;
  onRetry: () => void;
}

export function SmartDispatchPanel({
  loading,
  response,
  error,
  onApplyRecommendation,
  onRetry,
}: SmartDispatchPanelProps) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border border-border rounded-md p-6 bg-card"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Evaluating eligible dispatch combinations...
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              Checking vehicle availability
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              Validating cargo capacity
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              Checking driver eligibility
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-1 bg-muted-foreground rounded-full" />
              Ranking valid combinations
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border rounded-md p-6 bg-card"
      >
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <AlertCircle size={16} className="text-red-400 mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Unable to evaluate dispatch options
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              TransitOps could not calculate dispatch recommendations.
            </p>
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!response) return null;

  if (response.recommendations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-border rounded-md p-6 bg-card"
      >
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              No valid dispatch combination found
            </h3>
            <p className="text-xs text-muted-foreground">
              TransitOps could not identify an eligible vehicle and driver for
              this trip.
            </p>
          </div>

          {response.excludedResources.length > 0 && (
            <div className="space-y-2 p-3 bg-muted rounded border border-border">
              <p className="text-xs font-medium text-foreground">
                Reasons:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {response.excludedResources
                  .slice(0, 3)
                  .map((resource, idx) => (
                    <li key={idx} className="flex gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>
                        {resource.type === 'VEHICLE'
                          ? `${response.totalEligibleVehicles}/${response.totalEligibleVehicles + response.excludedResources.filter(r => r.type === 'VEHICLE').length} vehicles`
                          : `${response.totalEligibleDrivers}/${response.totalEligibleDrivers + response.excludedResources.filter(r => r.type === 'DRIVER').length} drivers`}{' '}
                        {resource.reason.toLowerCase()}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {response.excludedResources.length > 0 && (
            <ExcludedResourcesDrawer resources={response.excludedResources} />
          )}
        </div>
      </motion.div>
    );
  }

  const topRecommendation = response.recommendations[0];
  const otherRecommendations = response.recommendations.slice(1, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Top Recommendation */}
      <div className="border border-border rounded-md p-4 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recommended dispatch
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ranked using fleet efficiency, estimated cost, capacity fit,
              driver safety, and vehicle utilization.
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-semibold text-foreground">
              {topRecommendation.score}
            </div>
            <div className="text-xs text-muted-foreground">Dispatch score</div>
          </div>
        </div>

        <div className="border-t border-border pt-3 mb-3">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Vehicle Card */}
            <div className="bg-background rounded border border-border p-2.5">
              <p className="text-xs text-muted-foreground mb-1">Vehicle</p>
              <p className="font-semibold text-foreground">
                {topRecommendation.vehicle.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {topRecommendation.vehicle.registrationNumber}
              </p>
              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                <div>
                  {topRecommendation.vehicle.maxLoadCapacity} kg capacity
                </div>
                <div>
                  {getFuelEfficiency(topRecommendation.vehicle).toFixed(1)}{' '}
                  km/L
                </div>
                <div className="text-emerald-400">Available</div>
              </div>
            </div>

            {/* Driver Card */}
            <div className="bg-background rounded border border-border p-2.5">
              <p className="text-xs text-muted-foreground mb-1">Driver</p>
              <p className="font-semibold text-foreground">
                {topRecommendation.driver.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {topRecommendation.driver.licenseCategory}
              </p>
              <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                <div>
                  Safety {topRecommendation.driver.safetyScore}/100
                </div>
                <div>Licence valid</div>
                <div className="text-emerald-400">Available</div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-3 mb-3">
            <div className="flex items-center justify-between text-[0.8125rem]">
              <span className="text-muted-foreground">
                Estimated trip cost
              </span>
              <span className="font-semibold text-foreground">
                ₹{formatNumber(topRecommendation.estimatedTripCost)}
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-foreground">
              Why this combination
            </p>
            {topRecommendation.reasons.map((reason, idx) => (
              <div
                key={idx}
                className="flex gap-2 text-xs text-muted-foreground"
              >
                <Check size={14} className="flex-shrink-0 text-emerald-400 mt-0.5" />
                <span>{reason.message}</span>
              </div>
            ))}
          </div>

          <ScoreBreakdown breakdown={topRecommendation.scoreBreakdown} />

          <Button
            variant="primary"
            size="md"
            className="w-full mt-4"
            onClick={() => onApplyRecommendation(topRecommendation)}
          >
            Use this combination
          </Button>
        </div>
      </div>

      {/* Other Valid Options */}
      {otherRecommendations.length > 0 && (
        <div className="border border-border rounded-md p-4 bg-card">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Other valid options
          </h3>
          <div className="space-y-2">
            {otherRecommendations.map((rec) => (
              <motion.div
                key={`${rec.vehicle.id}-${rec.driver.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between p-2.5 bg-muted rounded border border-border text-[0.8125rem]"
              >
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    #{rec.rank} — {rec.vehicle.name} + {rec.driver.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Estimated cost ₹{formatNumber(rec.estimatedTripCost)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-semibold text-foreground">
                    {rec.score}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onApplyRecommendation(rec)}
                  >
                    Use
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Excluded Resources */}
      {response.excludedResources.length > 0 && (
        <ExcludedResourcesDrawer resources={response.excludedResources} />
      )}
    </motion.div>
  );
}

// ============================================================
// SCORE BREAKDOWN
// ============================================================

interface ScoreBreakdownProps {
  breakdown: {
    fuelEfficiency: number;
    tripCost: number;
    capacityFit: number;
    driverSafety: number;
    vehicleUtilization: number;
  };
}

function ScoreBreakdown({ breakdown }: ScoreBreakdownProps) {
  const [expanded, setExpanded] = useState(false);

  const weightedScore =
    breakdown.fuelEfficiency * 0.3 +
    breakdown.tripCost * 0.25 +
    breakdown.capacityFit * 0.2 +
    breakdown.driverSafety * 0.15 +
    breakdown.vehicleUtilization * 0.1;

  return (
    <div className="border border-border rounded bg-muted/50 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2.5 hover:bg-muted transition-colors text-foreground font-medium"
      >
        <span>View score breakdown</span>
        <ChevronDown
          size={14}
          className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border overflow-hidden"
          >
            <div className="p-2.5 space-y-2">
              <div className="grid grid-cols-3 gap-2 text-[0.75rem]">
                <div className="text-muted-foreground">Fuel efficiency</div>
                <div className="text-foreground font-medium text-right">
                  {breakdown.fuelEfficiency.toFixed(0)} / 100
                </div>
                <div className="text-muted-foreground text-right">30%</div>

                <div className="text-muted-foreground">Estimated trip cost</div>
                <div className="text-foreground font-medium text-right">
                  {breakdown.tripCost.toFixed(0)} / 100
                </div>
                <div className="text-muted-foreground text-right">25%</div>

                <div className="text-muted-foreground">Capacity fit</div>
                <div className="text-foreground font-medium text-right">
                  {breakdown.capacityFit.toFixed(0)} / 100
                </div>
                <div className="text-muted-foreground text-right">20%</div>

                <div className="text-muted-foreground">Driver safety</div>
                <div className="text-foreground font-medium text-right">
                  {breakdown.driverSafety.toFixed(0)} / 100
                </div>
                <div className="text-muted-foreground text-right">15%</div>

                <div className="text-muted-foreground">Vehicle utilization</div>
                <div className="text-foreground font-medium text-right">
                  {breakdown.vehicleUtilization.toFixed(0)} / 100
                </div>
                <div className="text-muted-foreground text-right">10%</div>
              </div>

              <div className="border-t border-border pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Weighted dispatch score:
                  </span>
                  <span className="font-semibold text-foreground">
                    {weightedScore.toFixed(1)} / 100
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// EXCLUDED RESOURCES DRAWER
// ============================================================

interface ExcludedResourcesDrawerProps {
  resources: ExcludedResource[];
}

function ExcludedResourcesDrawer({ resources }: ExcludedResourcesDrawerProps) {
  const [expanded, setExpanded] = useState(false);

  if (resources.length === 0) return null;

  return (
    <div className="border border-border rounded-md p-4 bg-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="text-left flex-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            View excluded resources
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {resources.length}{' '}
            {resources.length === 1 ? 'resource' : 'resources'} excluded
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 transition-transform text-muted-foreground ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border mt-3 pt-3 overflow-hidden"
          >
            <div className="space-y-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="text-xs p-2.5 bg-muted rounded border border-border"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={13}
                      className="text-amber-400 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="font-medium text-foreground">
                        {resource.name}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Ineligible
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {resource.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// HELPER FUNCTION
// ============================================================

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

function getFuelEfficiency(vehicle: any): number {
  const VEHICLE_FUEL_EFFICIENCY: Record<string, number> = {
    'Van-05': 12.4,
    'Van-08': 11.2,
    'Van-03': 11.8,
    'Mini Truck-02': 10.1,
    'Truck-12': 8.7,
    'Truck-09': 7.82,
  };
  return VEHICLE_FUEL_EFFICIENCY[vehicle.name] || 10;
}
