/**
 * Demo Bootstrap
 *
 * Refactored to read the active workspace ID from the Session instead of
 * a separate demo workspace key.
 *
 * The Session (stored under 'wl:session') is the single source of truth.
 */

import type { IWorkspaceService } from '@services/workspace/IWorkspaceService';
import type { EntityId } from '@domain';
import { ContributorRole } from '@domain';
import { SESSION_STORAGE_KEY } from '@app/SessionContext';

/**
 * DEMO_OWNER_ID
 *
 * A stable synthetic owner id for the demo workspace.
 * Kept for backwards compatibility with existing feature page quick actions.
 */
export const DEMO_OWNER_ID: EntityId = 'demo-owner-001';

/**
 * getOrCreateDemoWorkspace
 *
 * Returns the active workspace ID from the current session.
 *
 * @returns The EntityId of the active workspace.
 * @throws when no active session is found.
 */
export async function getOrCreateDemoWorkspace(
  _workspaceService?: IWorkspaceService,
): Promise<EntityId> {
  const sessionStr = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionStr) {
    throw new Error('[Bootstrap] No active session found. Cannot retrieve workspace ID.');
  }

  try {
    const session = JSON.parse(sessionStr);
    if (session && session.workspaceId) {
      return session.workspaceId;
    }
  } catch (error) {
    console.error('[Bootstrap] Failed to parse session:', error);
  }

  throw new Error('[Bootstrap] Invalid session structure in local storage.');
}

export { ContributorRole };
