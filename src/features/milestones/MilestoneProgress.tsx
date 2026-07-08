/**
 * MilestoneProgress
 *
 * Shows a labelled progress bar for a Milestone.
 * Accepts raw counts — never a stored percentage.
 */

import { ProgressBar } from '@shared/components/ProgressBar';
import type { MilestoneProgress as MilestoneProgressData } from './useMilestones';

interface MilestoneProgressProps {
  data: MilestoneProgressData;
}

export function MilestoneProgress({ data }: MilestoneProgressProps) {
  const { total, completed } = data;

  if (total === 0) {
    return (
      <div className="flex items-center gap-2">
        <ProgressBar
          value={0}
          max={1}
          showLabel={false}
          aria-label="No assignments in this milestone"
        />
        <span className="text-xs text-text-muted shrink-0">No assignments</span>
      </div>
    );
  }

  const variant = completed === total ? 'success' : 'default';

  return (
    <div className="flex flex-col gap-1">
      <ProgressBar
        value={completed}
        max={total}
        showLabel
        variant={variant}
        aria-label={`${completed} of ${total} assignments completed`}
      />
      <p className="text-xs text-text-muted">
        {completed} / {total} assignment{total !== 1 ? 's' : ''} completed
      </p>
    </div>
  );
}
