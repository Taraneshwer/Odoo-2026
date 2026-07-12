import type { DisruptionEvent, RecoveryHistoryEntry, RecoveryPlan, RecoveryTrip, RecoveryVehicle, RecoveryDriver, ImpactedTripRecovery, RecoveryValidation } from './autorescue.types';

export interface AutoRescueDependencies {
  vehicles: RecoveryVehicle[];
  drivers: RecoveryDriver[];
  trips: RecoveryTrip[];
  today: string;
}

function isVehicleEligible(vehicle: RecoveryVehicle, cargoWeight: number): boolean {
  if (vehicle.status !== 'AVAILABLE') return false;
  return cargoWeight <= vehicle.maxLoadCapacity;
}

function isDriverEligible(driver: RecoveryDriver, today: string): boolean {
  if (driver.status !== 'AVAILABLE') return false;
  return new Date(driver.licenseExpiryDate) >= new Date(today);
}

function daysUntil(dateStr: string, today: string): number {
  const target = new Date(dateStr);
  const current = new Date(today);
  return Math.ceil((target.getTime() - current.getTime()) / 86400000);
}

function sortTrips(trips: RecoveryTrip[]): RecoveryTrip[] {
  return [...trips].sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    if (aDate !== bDate) return aDate - bDate;
    if (b.cargoWeight !== a.cargoWeight) return b.cargoWeight - a.cargoWeight;
    return b.plannedDistance - a.plannedDistance;
  });
}

export function detectImpactedTrips(disruption: DisruptionEvent, dependencies: AutoRescueDependencies): RecoveryTrip[] {
  const affectedTrips = dependencies.trips.filter(trip => {
    if (trip.status !== 'DISPATCHED' && trip.status !== 'DRAFT') return false;
    if (disruption.type === 'VEHICLE_UNAVAILABLE') {
      return trip.vehicleId === disruption.entityId;
    }
    if (disruption.type === 'DRIVER_UNAVAILABLE') {
      return trip.driverId === disruption.entityId;
    }
    return trip.vehicleId === disruption.entityId || trip.driverId === disruption.entityId;
  });

  return sortTrips(affectedTrips);
}

export function generateRecoveryPlan(disruption: DisruptionEvent, dependencies: AutoRescueDependencies): RecoveryPlan {
  const impactedTrips = detectImpactedTrips(disruption, dependencies);
  const reservedVehicles = new Set<string>();
  const reservedDrivers = new Set<string>();
  const today = dependencies.today;

  const recoveryItems: ImpactedTripRecovery[] = impactedTrips.map(trip => {
    const originalVehicle = dependencies.vehicles.find(v => v.id === trip.vehicleId) ?? null;
    const originalDriver = dependencies.drivers.find(d => d.id === trip.driverId) ?? null;
    const impactReason = disruption.type === 'VEHICLE_UNAVAILABLE'
      ? 'Assigned vehicle entered maintenance'
      : disruption.type === 'DRIVER_UNAVAILABLE'
        ? 'Assigned driver became unavailable'
        : 'Trip cancellation triggered reassignment review';

    let proposedVehicle: RecoveryVehicle | null = null;
    let proposedDriver: RecoveryDriver | null = null;
    const validation: RecoveryValidation[] = [];

    const vehicleCandidates = dependencies.vehicles.filter(v => isVehicleEligible(v, trip.cargoWeight) && !reservedVehicles.has(v.id));
    const driverCandidates = dependencies.drivers.filter(d => isDriverEligible(d, today) && !reservedDrivers.has(d.id));

    const vehicleMatch = vehicleCandidates.find(v => v.id !== trip.vehicleId && v.id !== originalVehicle?.id);
    const driverMatch = driverCandidates.find(d => d.id !== trip.driverId && d.id !== originalDriver?.id);

    if (vehicleMatch) {
      proposedVehicle = vehicleMatch;
      reservedVehicles.add(vehicleMatch.id);
      validation.push({ rule: 'Vehicle available', status: 'PASS', message: `${vehicleMatch.name} is available for recovery` });
      validation.push({ rule: 'Cargo capacity validated', status: trip.cargoWeight <= vehicleMatch.maxLoadCapacity ? 'PASS' : 'FAIL' });
    } else {
      validation.push({ rule: 'Vehicle available', status: 'FAIL', message: 'No eligible replacement vehicle available' });
    }

    if (driverMatch) {
      proposedDriver = driverMatch;
      reservedDrivers.add(driverMatch.id);
      validation.push({ rule: 'Driver available', status: 'PASS', message: `${driverMatch.name} is available for recovery` });
      validation.push({ rule: 'Licence valid', status: 'PASS', message: 'Driver licence is current' });
    } else {
      validation.push({ rule: 'Driver available', status: 'FAIL', message: 'No eligible replacement driver available' });
    }

    const recoverable = Boolean(proposedVehicle && proposedDriver);

    return {
      trip: {
        ...trip,
        vehicleId: trip.vehicleId,
        driverId: trip.driverId,
      },
      impactReason,
      originalVehicle,
      originalDriver,
      proposedVehicle,
      proposedDriver,
      status: recoverable ? 'RECOVERABLE' : 'UNRESOLVED',
      validation,
    };
  });

  const recoverableTrips = recoveryItems.filter(item => item.status === 'RECOVERABLE').length;
  const unresolvedTrips = recoveryItems.filter(item => item.status === 'UNRESOLVED').length;
  const estimatedDelayAvoidedHours = recoverableTrips * 6.5;

  return {
    id: `${disruption.id}-plan`,
    disruption,
    status: unresolvedTrips === 0 ? 'READY' : recoverableTrips > 0 ? 'PARTIAL' : 'NO_RECOVERY',
    impactedTrips: recoveryItems,
    summary: {
      impactedTrips: recoveryItems.length,
      recoverableTrips,
      unresolvedTrips,
      estimatedDelayAvoidedHours,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function getRecoveryHistory(history: RecoveryHistoryEntry[]): RecoveryHistoryEntry[] {
  return [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function applyRecoveryPlan(plan: RecoveryPlan, trips: RecoveryTrip[]): RecoveryTrip[] {
  const updatedTrips = [...trips];
  plan.impactedTrips.forEach(item => {
    if (item.status === 'RECOVERABLE' && item.proposedVehicle && item.proposedDriver) {
      const tripIndex = updatedTrips.findIndex(trip => trip.id === item.trip.id);
      if (tripIndex >= 0) {
        updatedTrips[tripIndex] = {
          ...updatedTrips[tripIndex],
          vehicleId: item.proposedVehicle.id,
          driverId: item.proposedDriver.id,
        };
      }
    }
  });
  return updatedTrips;
}
