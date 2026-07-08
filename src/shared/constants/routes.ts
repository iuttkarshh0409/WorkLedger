/**
 * Routes
 *
 * Centralized route path constants for the entire application.
 *
 * Rules:
 * - No raw path strings anywhere else in the codebase.
 * - All navigation, links, and router definitions reference this file.
 * - Future dynamic routes (e.g. /contributors/:id) will be added here as builders.
 */

export const ROUTES = {
  ROOT: '/',
  DASHBOARD: '/dashboard',
  CONTRIBUTORS: '/contributors',
  MILESTONES: '/milestones',
  ASSIGNMENTS: '/assignments',
  REVIEWS: '/reviews',
  ACTIVITY: '/activity',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  CONTRIBUTOR_PROFILE: '/contributors/:contributorId',
} as const;

export function contributorProfilePath(id: string): string {
  return `/contributors/${encodeURIComponent(id)}`;
}

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

// ─── Filtered link builders ───────────────────────────────────────────────────

/**
 * assignmentsWithFilter
 *
 * Returns a URL string for the Assignments page pre-filtered by status.
 *
 * Usage:
 *   <Link to={assignmentsWithFilter('Submitted')}>Pending review</Link>
 *
 * The Assignments page reads this param on mount and sets its initial filter state.
 */
export function assignmentsWithFilter(status: string): string {
  return `${ROUTES.ASSIGNMENTS}?status=${encodeURIComponent(status)}`;
}
