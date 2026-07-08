/**
 * Navigation
 *
 * Primary navigation items for the application sidebar.
 * Order matches the documented information hierarchy from 06_ui_architecture.md.
 *
 * Icon names are string identifiers resolved inside the Sidebar component.
 * This keeps navigation data decoupled from any icon library choice.
 */

import { ROUTES } from './routes';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  description: string;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: 'dashboard',
    description: 'Workspace overview and pending actions',
  },
  {
    label: 'Contributors',
    path: ROUTES.CONTRIBUTORS,
    icon: 'contributors',
    description: 'Contributor profiles and performance history',
  },
  {
    label: 'Milestones',
    path: ROUTES.MILESTONES,
    icon: 'milestones',
    description: 'Project milestones and grouped assignments',
  },
  {
    label: 'Assignments',
    path: ROUTES.ASSIGNMENTS,
    icon: 'assignments',
    description: 'Delegated work and its complete lifecycle',
  },
  {
    label: 'Reviews',
    path: ROUTES.REVIEWS,
    icon: 'reviews',
    description: 'Published evaluations and structured feedback',
  },
  {
    label: 'Activity',
    path: ROUTES.ACTIVITY,
    icon: 'activity',
    description: 'Chronological workspace event history',
  },
  {
    label: 'Analytics',
    path: ROUTES.ANALYTICS,
    icon: 'analytics',
    description: 'Derived metrics and contributor insights',
  },
  {
    label: 'Settings',
    path: ROUTES.SETTINGS,
    icon: 'settings',
    description: 'Workspace configuration and member management',
  },
];
