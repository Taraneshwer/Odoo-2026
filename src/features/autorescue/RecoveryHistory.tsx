import React from 'react';
import type { RecoveryHistoryEntry } from './autorescue.types';

interface RecoveryHistoryProps {
  entries: RecoveryHistoryEntry[];
  onView: (entry: RecoveryHistoryEntry) => void;
}

export function RecoveryHistory({ entries, onView }: RecoveryHistoryProps) {
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-card">
        <h3 className="text-sm font-semibold text-foreground">AutoRescue History</h3>
      </div>
      <table className="w-full text-[0.8125rem]">
        <thead>
          <tr className="border-b border-border bg-card">
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Disruption</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Impacted</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Recovered</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id} className="border-b border-border/60">
              <td className="px-4 py-3 text-muted-foreground">{new Date(entry.date).toLocaleDateString('en-IN')}</td>
              <td className="px-4 py-3 text-foreground">{entry.disruption.reason}</td>
              <td className="px-4 py-3">{entry.impactedTrips}</td>
              <td className="px-4 py-3">{entry.recovered}</td>
              <td className="px-4 py-3">{entry.status}</td>
              <td className="px-4 py-3">
                <button onClick={() => onView(entry)} className="text-xs font-medium text-primary">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
