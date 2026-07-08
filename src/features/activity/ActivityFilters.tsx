/**
 * ActivityFilters
 *
 * Client-side filter controls for the Activity timeline.
 * Provides event group, contributor, search, and date range filters.
 */

import { clsx } from 'clsx';
import type { Contributor } from '@domain';
import {
  type ActivityFilters,
  type ActivityGroup,
  ACTIVITY_GROUP_LABELS,
  DEFAULT_ACTIVITY_FILTERS,
} from './useActivity';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityFiltersProps {
  filters:      ActivityFilters;
  contributors: Contributor[];
  totalCount:   number;
  shownCount:   number;
  onChange:     (partial: Partial<ActivityFilters>) => void;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const selectClass = clsx(
  'h-8 rounded-md border border-border bg-surface pl-2.5 pr-7 py-0',
  'text-xs text-text-primary',
  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
  'transition-colors duration-150 cursor-pointer appearance-none',
);

const Chevron = () => (
  <svg className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
    xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityFilters({
  filters,
  contributors,
  totalCount,
  shownCount,
  onChange,
}: ActivityFiltersProps) {
  const isFiltered =
    filters.group         !== '' ||
    filters.contributorId !== '' ||
    filters.search        !== '' ||
    filters.dateFrom      !== '' ||
    filters.dateTo        !== '';

  const handleClear = () => onChange(DEFAULT_ACTIVITY_FILTERS);

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            aria-label="Search activity"
            placeholder="Search events…"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className={clsx(
              'h-8 rounded-md border border-border bg-surface pl-8 pr-3 py-0',
              'text-xs text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
              'transition-colors duration-150 w-44',
            )}
          />
        </div>

        {/* Group */}
        <div className="relative">
          <select
            aria-label="Filter by event type"
            value={filters.group}
            onChange={(e) => onChange({ group: e.target.value as ActivityGroup })}
            className={selectClass}
          >
            {(Object.entries(ACTIVITY_GROUP_LABELS) as [ActivityGroup, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ),
            )}
          </select>
          <Chevron />
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
            <Chevron />
          </div>
        )}

        {/* Date from */}
        <input
          type="date"
          aria-label="From date"
          value={filters.dateFrom}
          max={filters.dateTo || undefined}
          onChange={(e) => onChange({ dateFrom: e.target.value })}
          className={clsx(selectClass, 'pr-2.5 cursor-pointer')}
          title="From date"
        />

        {/* Date to */}
        <input
          type="date"
          aria-label="To date"
          value={filters.dateTo}
          min={filters.dateFrom || undefined}
          onChange={(e) => onChange({ dateTo: e.target.value })}
          className={clsx(selectClass, 'pr-2.5 cursor-pointer')}
          title="To date"
        />

        {/* Clear */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors duration-150"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Result count */}
      {isFiltered && (
        <p className="text-xs text-text-muted">
          Showing {shownCount} of {totalCount} event{totalCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
