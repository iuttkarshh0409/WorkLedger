/**
 * ActivityPage
 *
 * Connected container for the Activity Timeline feature.
 *
 * Responsibilities:
 * - Wire service instances into useActivity
 * - Delegate all rendering to feature components
 *
 * No business logic. No mutations. Read-only presentation of existing data.
 *
 * Data flow:
 *   mount  → useActivity → bootstrap → getActivitiesByWorkspace + getContributorsByWorkspace
 *   filter → ActivityFilters → useActivity.setFilters → client-side derived
 */

import { useServices }       from '@hooks/useServices';
import { useActivity }       from '@features/activity/useActivity';
import { ActivityFilters }   from '@features/activity/ActivityFilters';
import { ActivityTimeline }  from '@features/activity/ActivityTimeline';
import { ActivityEmptyState} from '@features/activity/ActivityEmptyState';
import { DEFAULT_ACTIVITY_FILTERS } from '@features/activity/useActivity';

export function ActivityPage() {
  const {
    activity:    activityService,
    contributor: contributorService,
    workspace:   workspaceService,
  } = useServices();

  const {
    activities,
    filteredActivities,
    contributors,
    filters,
    loading,
    error,
    setFilters,
  } = useActivity(activityService, contributorService, workspaceService);

  const isFiltered =
    filters.group         !== '' ||
    filters.contributorId !== '' ||
    filters.search        !== '' ||
    filters.dateFrom      !== '' ||
    filters.dateTo        !== '';

  const handleClearFilters = () => setFilters(DEFAULT_ACTIVITY_FILTERS);

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="page-header">
          <h2 className="page-title">Activity</h2>
          <p className="page-description">
            {activities.length > 0
              ? `${activities.length} event${activities.length !== 1 ? 's' : ''} in this workspace`
              : 'Complete chronological record of workspace events'}
          </p>
        </div>

        {activities.length > 0 && !loading && (
          <span className="shrink-0 text-xs text-text-muted mt-1">
            Newest first
          </span>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div role="status" aria-label="Loading activity" className="flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse" aria-hidden="true">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-surface-muted mt-0.5 shrink-0" />
                {i < 5 && <div className="w-px h-10 bg-surface-muted mt-1" />}
              </div>
              <div className="flex-1 pb-5 flex flex-col gap-1.5">
                <div className="h-3 w-36 rounded bg-surface-muted" />
                <div className="h-2.5 w-24 rounded bg-surface-muted" />
                <div className="h-2.5 w-48 rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div role="alert" className="card border-red-200 bg-red-50 text-sm text-red-700">
          <p className="font-medium mb-1">Failed to load activity</p>
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Filters — shown only when there is data */}
      {!loading && !error && activities.length > 0 && (
        <ActivityFilters
          filters={filters}
          contributors={contributors}
          totalCount={activities.length}
          shownCount={filteredActivities.length}
          onChange={setFilters}
        />
      )}

      {/* Empty state */}
      {!loading && !error && filteredActivities.length === 0 && (
        <ActivityEmptyState
          isFiltered={isFiltered}
          onClearFilters={isFiltered ? handleClearFilters : undefined}
        />
      )}

      {/* Timeline */}
      {!loading && !error && filteredActivities.length > 0 && (
        <ActivityTimeline
          activities={filteredActivities}
          contributors={contributors}
        />
      )}
    </div>
  );
}
