import type { DisruptionEvent } from './autorescue.types';

export function formatDisruptionLabel(disruption: DisruptionEvent): string {
  if (disruption.type === 'VEHICLE_UNAVAILABLE') return `Vehicle unavailable · ${disruption.entityName}`;
  if (disruption.type === 'DRIVER_UNAVAILABLE') return `Driver unavailable · ${disruption.entityName}`;
  return `Trip cancelled · ${disruption.entityName}`;
}

export function getDisruptionStatusLabel(status: string): string {
  switch (status) {
    case 'IMPACT_DETECTED':
      return 'Impact detected';
    case 'PLAN_GENERATING':
      return 'Plan generating';
    case 'PLAN_READY':
      return 'Plan ready';
    case 'PARTIALLY_RECOVERABLE':
      return 'Partially recoverable';
    case 'NO_RECOVERY_AVAILABLE':
      return 'No recovery available';
    case 'APPLIED':
      return 'Applied';
    default:
      return 'Review pending';
  }
}
