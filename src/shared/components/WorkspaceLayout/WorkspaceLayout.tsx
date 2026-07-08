/**
 * WorkspaceLayout
 *
 * Route-level layout wrapper used by React Router's nested routes.
 *
 * Responsibilities (per 06.5_component_architecture.md Layer 2):
 * - Wrap all workspace routes inside AppShell.
 * - Render the active route's page via <Outlet />.
 * - Remain the single layout boundary between the shell and feature pages.
 *
 * This component is intentionally thin.
 * All structural concerns belong in AppShell.
 * All business concerns belong in individual feature pages.
 */

import { Outlet } from 'react-router-dom';
import { AppShell } from '@shared/components/AppShell';

// ─── Component ───────────────────────────────────────────────────────────────

export function WorkspaceLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
