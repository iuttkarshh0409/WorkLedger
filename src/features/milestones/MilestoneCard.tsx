/**
 * MilestoneCard
 *
 * Displays a single Milestone with stable layout and derived progress.
 */

import { useState } from 'react';
import { clsx } from 'clsx';
import type { Milestone } from '@domain';
import { MilestoneStatus } from '@domain';
import { ConfirmDialog } from '@shared/components/ConfirmDialog';
import { MilestoneProgress } from './MilestoneProgress';
import type { MilestoneProgress as MilestoneProgressData } from './useMilestones';
import { formatRelativeTime, formatExactTime } from '@lib/time';

// ─── Status badge ─────────────────────────────────────────────────────────────

function statusConfig(s: MilestoneStatus): { label: string; cls: string } {
  switch (s) {
    case MilestoneStatus.Planned:   return { label: 'Planned',   cls: 'bg-surface-muted text-text-muted ring-border' };
    case MilestoneStatus.Active:    return { label: 'Active',    cls: 'bg-blue-50 text-blue-700 ring-blue-600/20' };
    case MilestoneStatus.Completed: return { label: 'Completed', cls: 'bg-green-50 text-green-700 ring-green-600/20' };
    case MilestoneStatus.Archived:  return { label: 'Archived',  cls: 'bg-surface-muted text-text-muted ring-border' };
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface MilestoneCardProps {
  milestone:   Milestone;
  progress:    MilestoneProgressData;
  onComplete:  (id: string) => void;
  onArchive:   (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MilestoneCard({ milestone, progress, onComplete, onArchive }: MilestoneCardProps) {
  const status     = statusConfig(milestone.status);
  const isArchived = milestone.status === MilestoneStatus.Archived;
  const [confirmArchive,   setConfirmArchive]   = useState(false);
  const [confirmComplete,  setConfirmComplete]  = useState(false);

  const isOverdue =
    milestone.status !== MilestoneStatus.Completed &&
    milestone.status !== MilestoneStatus.Archived &&
    new Date(milestone.deadline) < new Date();

  return (
    <div className={clsx('card flex flex-col gap-3', isArchived && 'opacity-60')}>
      {/* Title + status */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-text-primary leading-snug flex-1 min-w-0">
          {milestone.title}
        </h3>
        <span className={clsx(
          'shrink-0 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
          status.cls,
        )}>
          {status.label}
        </span>
      </div>

      {/* Description */}
      {milestone.description && (
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
          {milestone.description}
        </p>
      )}

      {/* Dates */}
      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span>
          Starts <time dateTime={milestone.startDate} title={formatExactTime(milestone.startDate)}>
            {formatRelativeTime(milestone.startDate)}
          </time>
        </span>
        <span className={clsx(isOverdue && 'text-danger font-medium')}>
          {isOverdue ? 'Overdue · ' : 'Due '}
          <time dateTime={milestone.deadline} title={formatExactTime(milestone.deadline)}>
            {formatRelativeTime(milestone.deadline)}
          </time>
        </span>
      </div>

      {/* Progress */}
      <MilestoneProgress data={progress} />

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
        {milestone.status === MilestoneStatus.Active && (
          <button type="button" onClick={() => setConfirmComplete(true)}
            className={clsx(
              'text-xs font-medium px-3 py-1.5 rounded-md',
              'inline-flex items-center gap-1.5',
              'text-text-inverse bg-green-600 hover:bg-green-700',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}>
            <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
            Complete
          </button>
        )}
        {(milestone.status === MilestoneStatus.Completed) && (
          <button type="button" onClick={() => setConfirmArchive(true)}
            className="text-xs text-text-muted hover:text-danger transition-colors duration-150">
            Archive
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmComplete}
        title="Complete milestone"
        message={`Mark "${milestone.title}" as completed? This records it as a finished phase of work.`}
        confirmLabel="Complete"
        variant="default"
        onConfirm={() => { setConfirmComplete(false); onComplete(milestone.id); }}
        onCancel={() => setConfirmComplete(false)}
      />
      <ConfirmDialog
        open={confirmArchive}
        title="Archive milestone"
        message={`"${milestone.title}" will be archived. All assignments remain intact.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() => { setConfirmArchive(false); onArchive(milestone.id); }}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  );
}
