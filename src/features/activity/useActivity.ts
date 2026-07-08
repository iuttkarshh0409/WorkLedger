/**
 * useActivity
 *
 * Loads and filters the full workspace Activity stream.
 *
 * Responsibilities:
 * - Bootstrap demo workspace
 * - Load all activities for the workspace
 * - Load contributors for actor name resolution
 * - Apply client-side filters (type group, contributor, search, date range)
 * - Expose loading and error states
 *
 * Data flow:
 *   mount  → bootstrap → Promise.all([getActivitiesByWorkspace, getContributorsByWorkspace])
 *   filter → derived filteredActivities via useMemo (no service call)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Activity, Contributor, AnyDomainError, EntityId } from '@domain';
import type { IActivityService }    from '@services/activity/IActivityService';
import type { IContributorService } from '@services/contributor/IContributorService';
import type { IWorkspaceService }   from '@services/workspace/IWorkspaceService';
import { isDomainError } from '@lib/errors';
import { getOrCreateDemoWorkspace } from '@lib/bootstrap';

// ─── Activity group classification ───────────────────────────────────────────

/**
 * ActivityGroup
 *
 * Coarser filter dimension than ActivityType — lets the user filter
 * by domain area without choosing a specific event type.
 */
export type ActivityGroup =
  | ''
  | 'workspace'
  | 'contributor'
  | 'milestone'
  | 'assignment'
  | 'submission'
  | 'review';

export const ACTIVITY_GROUP_LABELS: Record<ActivityGroup, string> = {
  '':           'All events',
  workspace:    'Workspace',
  contributor:  'Contributors',
  milestone:    'Milestones',
  assignment:   'Assignments',
  submission:   'Submissions',
  review:       'Reviews',
};

/** Maps each ActivityType value to its group. */
const TYPE_GROUP: Record<string, ActivityGroup> = {
  'Workspace Created':   'workspace',
  'Workspace Updated':   'workspace',
  'Workspace Archived':  'workspace',
  'Contributor Joined':  'contributor',
  'Contributor Updated': 'contributor',
  'Contributor Archived':'contributor',
  'Milestone Created':   'milestone',
  'Milestone Updated':   'milestone',
  'Milestone Completed': 'milestone',
  'Milestone Archived':  'milestone',
  'Assignment Created':  'assignment',
  'Assignment Updated':  'assignment',
  'Assignment Accepted': 'assignment',
  'Assignment Completed':'assignment',
  'Assignment Archived': 'assignment',
  'Deadline Changed':    'assignment',
  'Submission Uploaded': 'submission',
  'Review Published':    'review',
  'Review Corrected':    'review',
  'Revision Requested':  'review',
};

export function groupOfType(type: string): ActivityGroup {
  return TYPE_GROUP[type] ?? '';
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export interface ActivityFilters {
  group:         ActivityGroup;
  contributorId: EntityId | '';
  search:        string;
  dateFrom:      string;   // yyyy-mm-dd or ''
  dateTo:        string;   // yyyy-mm-dd or ''
}

export const DEFAULT_ACTIVITY_FILTERS: ActivityFilters = {
  group:         '',
  contributorId: '',
  search:        '',
  dateFrom:      '',
  dateTo:        '',
};

// ─── Error formatting ─────────────────────────────────────────────────────────

function formatError(err: AnyDomainError): string {
  switch (err.kind) {
    case 'ValidationError': return err.errors.join(' ');
    case 'NotFoundError':   return `${err.entity} not found.`;
    case 'ConflictError':   return err.message;
    case 'PermissionError': return `Permission denied: ${err.reason}`;
    case 'DomainError':     return err.message;
  }
}

// ─── Filter logic ─────────────────────────────────────────────────────────────

function applyActivityFilters(
  activities:   Activity[],
  filters:      ActivityFilters,
  contributors: Contributor[],
): Activity[] {
  let result = activities;

  if (filters.group) {
    result = result.filter((a) => groupOfType(a.type) === filters.group);
  }

  if (filters.contributorId) {
    result = result.filter(
      (a) =>
        a.contributorId === filters.contributorId ||
        a.performedBy   === filters.contributorId,
    );
  }

  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    const nameFor = (id: string) =>
      contributors.find((c) => c.id === id)?.name.toLowerCase() ?? '';

    result = result.filter(
      (a) =>
        a.type.toLowerCase().includes(q) ||
        nameFor(a.performedBy).includes(q) ||
        (a.contributorId !== null && nameFor(a.contributorId).includes(q)),
    );
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    result = result.filter((a) => new Date(a.timestamp).getTime() >= from);
  }

  if (filters.dateTo) {
    // Include the entire "to" day by advancing to the next day
    const to = new Date(filters.dateTo);
    to.setDate(to.getDate() + 1);
    result = result.filter((a) => new Date(a.timestamp).getTime() < to.getTime());
  }

  return result;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseActivityState {
  activities:         Activity[];
  filteredActivities: Activity[];
  contributors:       Contributor[];
  filters:            ActivityFilters;
  loading:            boolean;
  error:              string | null;
}

interface UseActivityActions {
  setFilters: (partial: Partial<ActivityFilters>) => void;
}

export type UseActivityResult = UseActivityState & UseActivityActions;

export function useActivity(
  activityService:    IActivityService,
  contributorService: IContributorService,
  workspaceService:   IWorkspaceService,
): UseActivityResult {
  const [activities,   setActivities]   = useState<Activity[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [filters,      setFiltersState] = useState<ActivityFilters>(DEFAULT_ACTIVITY_FILTERS);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const wsId = await getOrCreateDemoWorkspace(workspaceService);
        if (cancelled) return;

        const [actResult, cResult] = await Promise.all([
          activityService.getActivitiesByWorkspace(wsId),
          contributorService.getContributorsByWorkspace(wsId),
        ]);

        if (cancelled) return;

        if (isDomainError(actResult)) { setError(formatError(actResult)); setLoading(false); return; }
        if (isDomainError(cResult))   { setError(formatError(cResult));   setLoading(false); return; }

        // Reverse to newest-first for display
        setActivities([...actResult].reverse());
        setContributors(cResult);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load activity.');
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [activityService, contributorService, workspaceService]);

  // ── Derived filtered list ─────────────────────────────────────────────────

  const filteredActivities = useMemo(
    () => applyActivityFilters(activities, filters, contributors),
    [activities, filters, contributors],
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const setFilters = useCallback((partial: Partial<ActivityFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  return {
    activities,
    filteredActivities,
    contributors,
    filters,
    loading,
    error,
    setFilters,
  };
}
