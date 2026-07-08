/**
 * Router
 *
 * Centralized route configuration for WorkLedger.
 *
 * Structure:
 * - Root redirects to /dashboard.
 * - All workspace routes are nested under WorkspaceLayout,
 *   which provides the persistent AppShell (Sidebar + Header).
 *
 * Adding a new route:
 * 1. Add the path constant to shared/constants/routes.ts.
 * 2. Add a NavItem to shared/constants/navigation.ts (if it appears in the sidebar).
 * 3. Add the route element here.
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';

import { WorkspaceLayout } from '@shared/components/WorkspaceLayout';
import { ProtectedRoute } from '@shared/components/ProtectedRoute';
import { ROUTES } from '@shared/constants/routes';

import { DashboardPage } from '@pages/DashboardPage';
import { ContributorsPage } from '@pages/ContributorsPage';
import { MilestonesPage } from '@pages/MilestonesPage';
import { AssignmentsPage } from '@pages/AssignmentsPage';
import { ReviewsPage } from '@pages/ReviewsPage';
import { ActivityPage } from '@pages/ActivityPage';
import { AnalyticsPage } from '@pages/AnalyticsPage';
import { SettingsPage } from '@pages/SettingsPage';
import { DemoEntryPage } from '@pages/DemoEntryPage';

export const router = createBrowserRouter([
  {
    // Redirect bare root to dashboard
    path: ROUTES.ROOT,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
  {
    path: '/demo-entry',
    element: <DemoEntryPage />,
  },
  {
    // All workspace routes share the persistent shell
    element: (
      <ProtectedRoute>
        <WorkspaceLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
      { path: ROUTES.CONTRIBUTORS, element: <ContributorsPage /> },
      { path: ROUTES.MILESTONES, element: <MilestonesPage /> },
      { path: ROUTES.ASSIGNMENTS, element: <AssignmentsPage /> },
      { path: ROUTES.REVIEWS, element: <ReviewsPage /> },
      { path: ROUTES.ACTIVITY, element: <ActivityPage /> },
      { path: ROUTES.ANALYTICS, element: <AnalyticsPage /> },
      { path: ROUTES.SETTINGS, element: <SettingsPage /> },
    ],
  },
]);
