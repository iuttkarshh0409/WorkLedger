/**
 * AssignmentFilters
 *
 * Client-side filter controls for the Assignments list.
 * Provides search, status, priority, and contributor filters.
 * All filtering occurs in useAssignments — this component is purely presentational.
 */

import { clsx } from 'clsx';
import type { Contributor } from '@domain';
import { AssignmentStatus, AssignmentPriority } from '@domain';
import type { AssignmentFilters } from './useAssignments';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: AssignmentStatus | ''; label: string }[] = [
  { value: '',                                label: 'All statuses' },
  { value: AssignmentStatus.Draft,            label: 'Draft' },
  { value: AssignmentStatus.Assigned,         label: 'Assigned' },
  { value: AssignmentStatus.Accepted,         label: 'Accepted' },
  { value: AssignmentStatus.InProgress,       label: 'In Progress' },
  { value: AssignmentStatus.Submitted,        label: 'Submitted' },
  { value: AssignmentStatus.UnderReview,      label: 'Under Review' },
  { value: AssignmentStatus.RevisionRequested,label: 'Revision Requested' },
  { value: AssignmentStatus.Completed,        label: 'Completed' },
  { value: AssignmentStatus.Archived,         label: 'Archived' },
];

const PRIORITY_OPTIONS: { value: AssignmentPriority | ''; label: string }[] = [
  { value: '',                         label: 'All priorities' },
  { value: AssignmentPriority.Low,     label: 'Low' },
  { value: AssignmentPriority.Medium,  label: 'Medium' },
  { value: AssignmentPriority.High,    label: 'High' },
  { value: AssignmentPriority.Critical,label: 'Critical' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignmentFiltersProps {
  filters:      AssignmentFilters;
  contributors: Contributor[];
  totalCount:   number;
  shownCount:   number;
  onChange:     (filters: Partial<AssignmentFilters>) => void;
}

// ─── Shared select style ──────────────────────────────────────────────────────

const selectClass = clsx(
  'h-8 rounded-md border border-border bg-surface pl-2.5 pr-7 py-0',
  'text-xs text-text-primary',
  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
  'transition-colors duration-150 cursor-pointer',
  'appearance-none',
);

// ─── Component ────────────────────────────────────────────────────────────────

export function AssignmentFilters({
  filters,
  contributors,
  totalCount,
  shownCount,
  onChange,
}: AssignmentFiltersProps) {
  const isFiltered =
    filters.search !== '' ||
    filters.status !== '' ||
    filters.priority !== '' ||
    filters.contributorId !== '';

  return (
    <div className="flex flex-col gap-3">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            aria-label="Search assignments"
            placeholder="Search assignments…"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className={clsx(
              'h-8 rounded-md border border-border bg-surface pl-8 pr-3 py-0',
              'text-xs text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
              'transition-colors duration-150 w-48',
            )}
          />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) => onChange({ status: e.target.value as AssignmentStatus | '' })}
            className={selectClass}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
            xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Priority */}
        <div className="relative">
          <select
            aria-label="Filter by priority"
            value={filters.priority}
            onChange={(e) => onChange({ priority: e.target.value as AssignmentPriority | '' })}
            className={selectClass}
          >
            {PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
            xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Contributor */}
        {contributors.length > 0 && (
          <div className="relative">
            <select
              aria-label="Filter by contributor"
              value={filters.contributorId}
              onChange={(e) => onChange({ contributorId: e.target.value })}
              className={selectClass}
            >
              <option value="">All contributors</option>
              {contributors.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
              xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        )}

        {/* Clear filters */}
        {isFiltered && (
          <button
            type="button"
            onClick={() => onChange({ search: '', status: '', priority: '', contributorId: '' })}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-150"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      {isFiltered && (
        <p className="text-xs text-text-muted">
          Showing {shownCount} of {totalCount} assignment{totalCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
