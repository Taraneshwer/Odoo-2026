import React from 'react';
import type { RecoverySummary as RecoverySummaryType } from './autorescue.types';

interface RecoverySummaryProps {
  summary: RecoverySummaryType;
}

export function RecoverySummary({ summary }: RecoverySummaryProps) {
  const items = [
    { label: 'Impacted trips', value: summary.impactedTrips },
    { label: 'Recoverable trips', value: summary.recoverableTrips },
    { label: 'Unresolved trips', value: summary.unresolvedTrips },
    { label: 'Estimated delay avoided', value: `${summary.estimatedDelayAvoidedHours} hrs` },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-4">
      {items.map(item => (
        <div key={item.label} className="rounded border border-border bg-card p-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-lg font-semibold text-foreground">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
