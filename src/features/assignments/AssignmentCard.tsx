/**
 * AssignmentCard
 *
 * Displays a single Assignment with a stable layout.
 * Every field renders with a placeholder when data is unavailable.
 *
 * Shows the next valid lifecycle action for in-scope states:
 *   Draft     → "Assign" (assignContributor — deferred, shown as no-op for now)
 *   Assigned  → "Accept"
 *   Accepted  → "Start"
 *   Completed → "Archive"
 *
 * @see docs/04_assignment_lifecycle.md (Allowed State Transitions)
 * @see docs/06_ui_architecture.md (Assignment card fields)
 */

import { useState } from 'react';
import { clsx } from 'clsx';
import type { Assignment, Contributor } from '@domain';
import { AssignmentStatus, AssignmentPriority, Authorization } from '@domain';
import { ConfirmDialog } from '@shared/components/ConfirmDialog';
import { useSession } from '@app/SessionContext';

// ─── Badge config helpers ─────────────────────────────────────────────────────

function statusConfig(status: AssignmentStatus): { label: string; className: string } {
  switch (status) {
    case AssignmentStatus.Draft:
      return { label: 'Draft',              className: 'bg-surface-muted text-text-muted ring-border' };
    case AssignmentStatus.Assigned:
      return { label: 'Assigned',           className: 'bg-blue-50 text-blue-700 ring-blue-600/20' };
    case AssignmentStatus.Accepted:
      return { label: 'Accepted',           className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' };
    case AssignmentStatus.InProgress:
      return { label: 'In Progress',        className: 'bg-amber-50 text-amber-700 ring-amber-600/20' };
    case AssignmentStatus.Submitted:
      return { label: 'Submitted',          className: 'bg-purple-50 text-purple-700 ring-purple-600/20' };
    case AssignmentStatus.UnderReview:
      return { label: 'Under Review',       className: 'bg-purple-50 text-purple-700 ring-purple-600/20' };
    case AssignmentStatus.RevisionRequested:
      return { label: 'Revision Requested', className: 'bg-orange-50 text-orange-700 ring-orange-600/20' };
    case AssignmentStatus.Resubmitted:
      return { label: 'Resubmitted',        className: 'bg-purple-50 text-purple-700 ring-purple-600/20' };
    case AssignmentStatus.Completed:
      return { label: 'Completed',          className: 'bg-green-50 text-green-700 ring-green-600/20' };
    case AssignmentStatus.Archived:
      return { label: 'Archived',           className: 'bg-surface-muted text-text-muted ring-border' };
  }
}

function priorityConfig(priority: AssignmentPriority): { label: string; className: string } {
  switch (priority) {
    case AssignmentPriority.Low:
      return { label: 'Low',      className: 'text-green-600' };
    case AssignmentPriority.Medium:
      return { label: 'Medium',   className: 'text-amber-600' };
    case AssignmentPriority.High:
      return { label: 'High',     className: 'text-orange-600' };
    case AssignmentPriority.Critical:
      return { label: 'Critical', className: 'text-red-600 font-semibold' };
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function isOverdue(deadline: string, status: AssignmentStatus): boolean {
  const terminal: AssignmentStatus[] = [
    AssignmentStatus.Completed,
    AssignmentStatus.Archived,
  ];
  return !terminal.includes(status) && new Date(deadline) < new Date();
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignmentCardProps {
  assignment:   Assignment;
  contributors: Contributor[];
  className?:   string;
  onAccept:     (id: string) => void;
  onStart:      (id: string) => void;
  onArchive:    (id: string) => void;
  onSubmit:     (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssignmentCard({
  assignment,
  contributors,
  className,
  onAccept,
  onStart,
  onArchive,
  onSubmit,
}: AssignmentCardProps) {
  const { session } = useSession();
  const status   = statusConfig(assignment.status);
  const priority = priorityConfig(assignment.priority);
  const overdue  = isOverdue(assignment.deadline, assignment.status);
  const isArchived = assignment.status === AssignmentStatus.Archived;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const contributor = contributors.find((c) => c.id === assignment.contributorId);
  const reviewer    = contributors.find((c) => c.id === assignment.reviewerId);

  return (
    <div className={clsx('card flex flex-col gap-3', isArchived && 'opacity-60', className)}>
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-text-primary leading-snug flex-1 min-w-0">
          {assignment.title || '—'}
        </h3>
        <span
          className={clsx(
            'shrink-0 inline-flex items-center rounded-md px-2 py-0.5',
            'text-xs font-medium ring-1 ring-inset',
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      {/* Description */}
      {assignment.description && (
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
          {assignment.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
        {/* Priority */}
        <span className={clsx('font-medium', priority.className)}>
          {priority.label}
        </span>

        {/* Contributor */}
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" />
          </svg>
          {contributor?.name ?? <span className="text-text-muted italic">Unassigned</span>}
        </span>

        {/* Reviewer */}
        {reviewer && (
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {reviewer.name}
          </span>
        )}

        {/* Deadline */}
        <span className={clsx('flex items-center gap-1', overdue && 'text-danger font-medium')}>
          <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {overdue ? 'Overdue · ' : ''}
          {formatDate(assignment.deadline)}
        </span>

        {/* Revision count */}
        {assignment.revisionCount > 0 && (
          <span className="flex items-center gap-1 text-orange-600">
            <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4" />
            </svg>
            {assignment.revisionCount} revision{assignment.revisionCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
        {assignment.status === AssignmentStatus.InProgress && session && Authorization.canSubmitWork(session.role, session.contributorId, assignment) && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSubmit(assignment.id); }}
            className={clsx(
              'text-xs font-medium px-3 py-1.5 rounded-md',
              'text-text-inverse bg-accent hover:bg-accent-hover',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            Submit work
          </button>
        )}

        {assignment.status === AssignmentStatus.RevisionRequested && session && Authorization.canSubmitWork(session.role, session.contributorId, assignment) && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onSubmit(assignment.id); }}
            className={clsx(
              'text-xs font-medium px-3 py-1.5 rounded-md',
              'text-accent border border-accent',
              'hover:bg-accent-subtle transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            Resubmit
          </button>
        )}

        {assignment.status === AssignmentStatus.Assigned && session && Authorization.canSubmitWork(session.role, session.contributorId, assignment) && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAccept(assignment.id); }}
            className={clsx(
              'text-xs font-medium px-3 py-1.5 rounded-md',
              'text-accent border border-accent',
              'hover:bg-accent-subtle transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            Accept
          </button>
        )}

        {assignment.status === AssignmentStatus.Accepted && session && Authorization.canSubmitWork(session.role, session.contributorId, assignment) && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onStart(assignment.id); }}
            className={clsx(
              'text-xs font-medium px-3 py-1.5 rounded-md',
              'text-accent border border-accent',
              'hover:bg-accent-subtle transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            Start work
          </button>
        )}

        {assignment.status === AssignmentStatus.Completed && session && Authorization.canArchiveAssignment(session.role) && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setConfirmOpen(true); }}
            className={clsx(
              'text-xs text-text-muted hover:text-danger',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
            aria-label={`Archive ${assignment.title}`}
          >
            Archive
          </button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Archive assignment"
        message={`"${assignment.title}" will be archived. It remains in the workspace history and cannot be modified further.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() => { setConfirmOpen(false); onArchive(assignment.id); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
