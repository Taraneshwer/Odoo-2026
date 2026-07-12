import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import type { DisruptionEvent } from './autorescue.types';
import { getDisruptionStatusLabel } from './autorescue.utils';

interface DisruptionPanelProps {
  disruption: DisruptionEvent;
  impactCount: number;
  status: string;
  onReview: () => void;
}

export function DisruptionPanel({ disruption, impactCount, status, onReview }: DisruptionPanelProps) {
  return (
    <div className="rounded-md border border-amber-400/20 bg-amber-400/8 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle size={15} className="mt-0.5 text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-foreground">Operational disruption detected</p>
            <p className="text-xs text-muted-foreground mt-1">{disruption.reason}</p>
            <p className="text-[11px] text-muted-foreground mt-2">{impactCount} trip{impactCount === 1 ? '' : 's'} require reassignment</p>
          </div>
        </div>
        <button
          onClick={onReview}
          className="inline-flex items-center gap-1.5 rounded border border-border bg-background/70 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
        >
          Review recovery plan
          <ArrowRight size={13} />
        </button>
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground">{getDisruptionStatusLabel(status)}</div>
    </div>
  );
}
