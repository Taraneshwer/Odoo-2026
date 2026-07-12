export type DisruptionType = 'VEHICLE_UNAVAILABLE' | 'DRIVER_UNAVAILABLE' | 'TRIP_CANCELLED';

export interface DisruptionEvent {
  id: string;
  type: DisruptionType;
  entityId: string;
  entityName: string;
  reason: string;
  occurredAt: string;
}

export type RecoveryPlanStatus = 'GENERATING' | 'READY' | 'PARTIAL' | 'NO_RECOVERY' | 'APPLIED';

export interface RecoveryValidation {
  rule: string;
  status: 'PASS' | 'FAIL';
  message?: string;
}

export interface RecoverySummary {
  impactedTrips: number;
  recoverableTrips: number;
  unresolvedTrips: number;
  estimatedDelayAvoidedHours: number;
}

export interface RecoveryTrip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export interface RecoveryVehicle {
  id: string;
  name: string;
  registrationNumber: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED';
  maxLoadCapacity: number;
}

export interface RecoveryDriver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED';
  safetyScore: number;
}

export interface ImpactedTripRecovery {
  trip: RecoveryTrip;
  impactReason: string;
  originalVehicle: RecoveryVehicle | null;
  originalDriver: RecoveryDriver | null;
  proposedVehicle: RecoveryVehicle | null;
  proposedDriver: RecoveryDriver | null;
  status: 'RECOVERABLE' | 'UNRESOLVED';
  validation: RecoveryValidation[];
}

export interface RecoveryPlan {
  id: string;
  disruption: DisruptionEvent;
  status: RecoveryPlanStatus;
  impactedTrips: ImpactedTripRecovery[];
  summary: RecoverySummary;
  generatedAt: string;
}

export interface RecoveryHistoryEntry {
  id: string;
  date: string;
  disruption: DisruptionEvent;
  impactedTrips: number;
  recovered: number;
  status: 'APPLIED' | 'PARTIAL' | 'NO_RECOVERY';
}
