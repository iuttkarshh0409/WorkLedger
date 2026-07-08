/**
 * ActivityEmptyState
 *
 * Shown when no activities exist yet (true empty workspace)
 * or when the current filters produce no results.
 *
 * @see docs/07_design_system.md (Empty states educate)
 */

interface ActivityEmptyStateProps {
  isFiltered: boolean;
  onClearFilters?: () => void;
}

export function ActivityEmptyState({ isFiltered, onClearFilters }: ActivityEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent-subtle mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
          aria-hidden="true"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>

      {isFiltered ? (
        <>
          <h3 className="text-base font-semibold text-text-primary mb-2">
            No events match these filters
          </h3>
          <p className="text-sm text-text-secondary max-w-sm mb-6 leading-relaxed">
            Try adjusting the event type, contributor, date range, or search term.
          </p>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-md
                text-sm font-medium text-text-secondary
                border border-border hover:bg-surface-muted
                transition-colors duration-150
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
              "
            >
              Clear filters
            </button>
          )}
        </>
      ) : (
        <>
          <h3 className="text-base font-semibold text-text-primary mb-2">
            No activity yet
          </h3>
          <p className="text-sm text-text-secondary max-w-sm mb-2 leading-relaxed">
            The Activity timeline records every meaningful event in this workspace —
            assignments created, submissions uploaded, reviews published, and more.
          </p>
          <p className="text-sm text-text-secondary max-w-sm leading-relaxed">
            Events appear here automatically as work progresses.
          </p>
        </>
      )}
    </div>
  );
}
