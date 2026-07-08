/**
 * SummaryCards
 *
 * Five metric cards giving an at-a-glance workspace overview.
 * Actionable cards link to the Assignments page pre-filtered by status.
 * All values are derived from existing data — nothing is persisted.
 *
 * @see docs/06_ui_architecture.md (Dashboard — workspace summary)
 * @see src/shared/constants/routes.ts (assignmentsWithFilter)
 */

import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import { AssignmentStatus } from '@domain';
import { ROUTES, assignmentsWithFilter } from '@shared/constants/routes';
import type { WorkspaceSummary } from './useDashboard';

// ─── Card variants ────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label:    string;
  value:    number;
  variant?: 'default' | 'warning' | 'success';
  to?:      string;
}

function SummaryCard({ label, value, variant = 'default', to }: SummaryCardProps) {
  const content = (
    <>
      <span
        className={clsx(
          'text-2xl font-bold leading-none',
          variant === 'warning' && value > 0 ? 'text-warning'     : '',
          variant === 'success' && value > 0 ? 'text-success'     : '',
          variant === 'default'              ? 'text-text-primary' : '',
        )}
      >
        {value}
      </span>
      <span className="text-xs text-text-secondary">{label}</span>
    </>
  );

  if (to && value > 0) {
    return (
      <Link
        to={to}
        className={clsx(
          'card flex flex-col gap-1',
          'hover:border-accent-hover hover:shadow-sm transition-all duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="card flex flex-col gap-1">
      {content}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SummaryCardsProps {
  summary: WorkspaceSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <SummaryCard
        label="Total contributors"
        value={summary.totalContributors}
        to={ROUTES.CONTRIBUTORS}
      />
      <SummaryCard
        label="Active contributors"
        value={summary.activeContributors}
        variant="success"
        to={ROUTES.CONTRIBUTORS}
      />
      <SummaryCard
        label="Active assignments"
        value={summary.activeAssignments}
        to={assignmentsWithFilter(AssignmentStatus.InProgress)}
      />
      <SummaryCard
        label="Completed assignments"
        value={summary.completedAssignments}
        variant="success"
        to={assignmentsWithFilter(AssignmentStatus.Completed)}
      />
      <SummaryCard
        label="Pending reviews"
        value={summary.pendingReviews}
        variant={summary.pendingReviews > 0 ? 'warning' : 'default'}
        to={assignmentsWithFilter(AssignmentStatus.Submitted)}
      />
    </div>
  );
}
