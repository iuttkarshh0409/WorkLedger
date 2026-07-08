/**
 * PendingAssignments
 *
 * Three prioritised groups of assignments requiring attention:
 *   1. Overdue — past deadline and still active (highest priority)
 *   2. Awaiting review — submitted, ready for a reviewer
 *   3. Awaiting submission — in progress or after revision request
 *
 * Section headings and overflow links navigate to the Assignments page
 * pre-filtered by the relevant status.
 *
 * @see docs/04_assignment_lifecycle.md
 * @see src/shared/constants/routes.ts (assignmentsWithFilter)
 */

import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { AssignmentStatus } from '@domain';
import { assignmentsWithFilter } from '@shared/constants/routes';
import type { PendingItem } from './useDashboard';

// ─── Single row ───────────────────────────────────────────────────────────────

interface PendingRowProps {
  item:     PendingItem;
  badge:    string;
  badgeCls: string;
  filterStatus: string;
}

function PendingRow({ item, badge, badgeCls, filterStatus }: PendingRowProps) {
  return (
    <Link
      to={assignmentsWithFilter(filterStatus)}
      className={clsx(
        'flex items-center gap-3 py-2 border-b border-border last:border-0',
        'hover:bg-surface-muted -mx-4 px-4 rounded-sm transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary truncate font-medium">
          {item.assignment.title}
        </p>
        <p className="text-xs text-text-muted truncate">
          {item.contributor?.name ?? 'Unassigned'}
          {item.isOverdue && (
            <span className="ml-1 text-danger font-medium">· Overdue</span>
          )}
        </p>
      </div>
      <span
        className={clsx(
          'shrink-0 inline-flex items-center rounded-md px-2 py-0.5',
          'text-xs font-medium ring-1 ring-inset',
          badgeCls,
        )}
      >
        {badge}
      </span>
    </Link>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface PendingSectionProps {
  title:        string;
  items:        PendingItem[];
  badge:        string;
  badgeCls:     string;
  filterStatus: string;
  emptyText:    string;
}

function PendingSection({
  title, items, badge, badgeCls, filterStatus, emptyText,
}: PendingSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide">
          {title} {items.length > 0 && `(${items.length})`}
        </h3>
        {items.length > 0 && (
          <Link
            to={assignmentsWithFilter(filterStatus)}
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            View all
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-text-muted py-2">{emptyText}</p>
      ) : (
        <div>
          {items.slice(0, 5).map((item) => (
            <PendingRow
              key={item.assignment.id}
              item={item}
              badge={badge}
              badgeCls={badgeCls}
              filterStatus={filterStatus}
            />
          ))}
          {items.length > 5 && (
            <Link
              to={assignmentsWithFilter(filterStatus)}
              className="block pt-2 text-xs text-accent hover:text-accent-hover transition-colors"
            >
              +{items.length - 5} more
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PendingAssignmentsProps {
  pendingWork: {
    awaitingSubmission: PendingItem[];
    awaitingReview:     PendingItem[];
    overdue:            PendingItem[];
  };
}

export function PendingAssignments({ pendingWork }: PendingAssignmentsProps) {
  const total =
    pendingWork.overdue.length +
    pendingWork.awaitingReview.length +
    pendingWork.awaitingSubmission.length;

  return (
    <div className="card flex flex-col gap-5">
      <h2 className="text-sm font-semibold text-text-primary">
        Pending work
        {total === 0 && (
          <span className="ml-2 text-xs font-normal text-text-muted">— all clear</span>
        )}
      </h2>

      {pendingWork.overdue.length > 0 && (
        <PendingSection
          title="Overdue"
          items={pendingWork.overdue}
          badge="Overdue"
          badgeCls="bg-red-50 text-red-700 ring-red-600/20"
          filterStatus={AssignmentStatus.InProgress}
          emptyText="No overdue assignments."
        />
      )}

      <PendingSection
        title="Awaiting review"
        items={pendingWork.awaitingReview}
        badge="Review"
        badgeCls="bg-purple-50 text-purple-700 ring-purple-600/20"
        filterStatus={AssignmentStatus.Submitted}
        emptyText="No assignments awaiting review."
      />

      <PendingSection
        title="Awaiting submission"
        items={pendingWork.awaitingSubmission}
        badge="In Progress"
        badgeCls="bg-amber-50 text-amber-700 ring-amber-600/20"
        filterStatus={AssignmentStatus.InProgress}
        emptyText="No assignments awaiting submission."
      />
    </div>
  );
}
