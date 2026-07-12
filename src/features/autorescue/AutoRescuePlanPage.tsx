import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, XCircle, CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useApp } from '../../app/App';
import { Button } from '../../app/components/ui/button';
import type { DisruptionEvent, RecoveryPlan, RecoveryPlanStatus } from './autorescue.types';
import { generateRecoveryPlan, applyRecoveryPlan } from './autorescue.service';
import { RecoverySummary } from './RecoverySummary';
import { toast } from 'sonner';

interface AutoRescuePlanPageProps {
  disruption: DisruptionEvent;
  onClose: () => void;
  onApplied: () => void;
}

export function AutoRescuePlanPage({ disruption, onClose, onApplied }: AutoRescuePlanPageProps) {
  const { state, dispatch } = useApp();
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const generated = generateRecoveryPlan(disruption, {
        vehicles: state.vehicles.map(v => ({
          id: v.id,
          name: v.name,
          registrationNumber: v.registrationNumber,
          status: v.status,
          maxLoadCapacity: v.maxLoadCapacity,
        })),
        drivers: state.drivers.map(d => ({
          id: d.id,
          name: d.name,
          licenseNumber: d.licenseNumber,
          licenseExpiryDate: d.licenseExpiryDate,
          status: d.status,
          safetyScore: d.safetyScore,
        })),
        trips: state.trips.map(t => ({
          id: t.id,
          source: t.source,
          destination: t.destination,
          vehicleId: t.vehicleId,
          driverId: t.driverId,
          cargoWeight: t.cargoWeight,
          plannedDistance: t.plannedDistance,
          status: t.status,
          createdAt: t.createdAt,
        })),
        today: new Date().toISOString().split('T')[0],
      });
      setPlan(generated);
      setLoading(false);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [disruption, state.drivers, state.trips, state.vehicles]);

  const recoverableCount = plan?.impactedTrips.filter(item => item.status === 'RECOVERABLE').length ?? 0;
  const unresolvedCount = plan?.impactedTrips.filter(item => item.status === 'UNRESOLVED').length ?? 0;

  const handleApply = () => {
    if (!plan) return;
    setApplying(true);
    setTimeout(() => {
      const updatedTrips = applyRecoveryPlan(plan, state.trips.map(t => ({
        id: t.id,
        source: t.source,
        destination: t.destination,
        vehicleId: t.vehicleId,
        driverId: t.driverId,
        cargoWeight: t.cargoWeight,
        plannedDistance: t.plannedDistance,
        status: t.status,
        createdAt: t.createdAt,
      })));

      updatedTrips.forEach(trip => {
        const existing = state.trips.find(item => item.id === trip.id);
        if (existing && (existing.vehicleId !== trip.vehicleId || existing.driverId !== trip.driverId)) {
          dispatch({ type: 'DISPATCH_TRIP', trip: { ...existing, vehicleId: trip.vehicleId, driverId: trip.driverId } as any });
        }
      });

      setApplying(false);
      setConfirmOpen(false);
      toast.success(`Recovery plan applied — ${recoverableCount} trips successfully reassigned.`);
      onApplied();
      onClose();
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">AutoRescue Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">Review proposed resource reassignments for the current fleet disruption.</p>
        </div>
        <Button variant="ghost" icon={<ArrowLeft size={14} />} onClick={onClose}>Back</Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Disruption</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{disruption.reason}</p>
            <p className="text-xs text-muted-foreground mt-1">Detected {new Date(disruption.occurredAt).toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded border border-border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
            {plan?.summary.impactedTrips ?? 0} impacted trips
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-3 w-40 rounded bg-muted animate-pulse" />
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-20 rounded border border-border bg-card animate-pulse" />)}
          </div>
        </div>
      ) : plan ? (
        <>
          <RecoverySummary summary={plan.summary} />
          <div className="space-y-3">
            {plan.impactedTrips.map(item => (
              <div key={item.trip.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.trip.id}</p>
                    <p className="text-xs text-muted-foreground">{item.trip.source} → {item.trip.destination}</p>
                  </div>
                  <span className={item.status === 'RECOVERABLE' ? 'rounded bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-400' : 'rounded bg-red-400/10 px-2 py-1 text-[11px] text-red-400'}>
                    {item.status === 'RECOVERABLE' ? 'Recoverable' : 'Unresolved'}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
                  <div className="rounded border border-border bg-background/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Original assignment</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{item.originalVehicle?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{item.originalDriver?.name ?? '—'}</p>
                  </div>
                  <div className="flex items-center justify-center text-muted-foreground">
                    <ArrowRight size={16} />
                  </div>
                  <div className="rounded border border-border bg-background/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Proposed recovery</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{item.proposedVehicle?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{item.proposedDriver?.name ?? '—'}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Impact reason</p>
                  <p className="mt-1 text-sm text-foreground">{item.impactReason}</p>
                </div>

                <div className="mt-4 space-y-2">
                  {item.validation.map(validation => (
                    <div key={validation.rule} className={validation.status === 'PASS' ? 'rounded border border-emerald-400/20 bg-emerald-400/8 p-2.5 text-xs text-emerald-400' : 'rounded border border-red-400/20 bg-red-400/8 p-2.5 text-xs text-red-400'}>
                      <span className="font-medium">{validation.rule}</span>
                      {validation.message ? ` · ${validation.message}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded border border-border bg-card p-6 text-center text-sm text-muted-foreground">Unable to generate recovery plan</div>
      )}

      <div className="sticky bottom-0 z-10 rounded-lg border border-border bg-card p-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {recoverableCount} of {plan?.impactedTrips.length ?? 0} impacted trips recoverable
          {unresolvedCount > 0 ? ` · ${unresolvedCount} requires manual intervention` : ''}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={applying} disabled={!plan || applying} onClick={() => setConfirmOpen(true)}>
            {recoverableCount > 0 ? `Apply ${recoverableCount} recovery${recoverableCount === 1 ? '' : 'ies'}` : 'Apply recovery plan'}
          </Button>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-foreground">Apply AutoRescue plan?</h3>
            <p className="mt-2 text-sm text-muted-foreground">This will update vehicle and driver assignments for {recoverableCount} trip{recoverableCount === 1 ? '' : 's'}.</p>
            <div className="mt-4 space-y-2">
              {plan?.impactedTrips.filter(item => item.status === 'RECOVERABLE').map(item => (
                <div key={item.trip.id} className="rounded border border-border bg-background/70 p-2 text-xs text-muted-foreground">
                  {item.trip.id}: {item.originalVehicle?.name} → {item.proposedVehicle?.name}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button variant="primary" loading={applying} onClick={handleApply}>Apply changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
