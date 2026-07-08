/**
 * useContributors
 *
 * Manages contributor state for the Contributors page.
 *
 * Responsibilities:
 * - Bootstrap the demo workspace on first use
 * - Load all contributors for the workspace
 * - Add a new contributor
 * - Archive an existing contributor
 * - Expose loading, error, and submitting states to the UI
 *
 * Data flow:
 *   mount → getOrCreateDemoWorkspace() → getContributorsByWorkspace()
 *   add   → addContributor()           → reload list
 *   archive → archiveContributor()     → reload list
 *
 * Error handling:
 *   DomainErrors from the service are returned as strings so the UI
 *   can display them inline without knowing about domain error types.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Contributor, CreateContributorInput, AnyDomainError } from '@domain';
import type { IContributorService } from '@services/contributor/IContributorService';
import type { IWorkspaceService } from '@services/workspace/IWorkspaceService';
import { isDomainError } from '@lib/errors';
import { getOrCreateDemoWorkspace, DEMO_OWNER_ID } from '@lib/bootstrap';
import { logEvent } from '@infrastructure/logging';
import { useSession } from '@app/SessionContext';

// ─── Types ────────────────────────────────────────────────────────────────────
// ... (rest of type interfaces unchanged)


interface UseContributorsState {
  contributors:  Contributor[];
  workspaceId:   string | null;
  loading:       boolean;
  error:         string | null;
  submitting:    boolean;
  submitError:   string | null;
}

interface UseContributorsActions {
  addContributor:     (input: Omit<CreateContributorInput, 'workspaceId'>) => Promise<boolean>;
  archiveContributor: (id: string) => Promise<boolean>;
  clearSubmitError:   () => void;
}

export type UseContributorsResult = UseContributorsState & UseContributorsActions;

// ─── Error formatting ─────────────────────────────────────────────────────────

function formatError(result: AnyDomainError): string {
  switch (result.kind) {
    case 'ValidationError':
      return result.errors.join(' ');
    case 'NotFoundError':
      return `${result.entity} not found.`;
    case 'ConflictError':
      return result.message;
    case 'PermissionError':
      return `Permission denied: ${result.reason}`;
    case 'DomainError':
      return result.message;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useContributors(
  contributorService: IContributorService,
  workspaceService: IWorkspaceService,
): UseContributorsResult {
  const { session } = useSession();
  const [state, setState] = useState<UseContributorsState>({
    contributors: [],
    workspaceId:  null,
    loading:      true,
    error:        null,
    submitting:   false,
    submitError:  null,
  });

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(
    async (wsId: string) => {
      const result = await contributorService.getContributorsByWorkspace(wsId);
      if (isDomainError(result)) {
        setState((s) => ({
          ...s,
          loading: false,
          error:   formatError(result),
        }));
        return;
      }
      setState((s) => ({
        ...s,
        contributors: result,
        loading:      false,
        error:        null,
      }));
    },
    [contributorService],
  );

  // ── Bootstrap + initial load ──────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const wsId = await getOrCreateDemoWorkspace(workspaceService);
        if (cancelled) return;

        setState((s) => ({ ...s, workspaceId: wsId }));
        await load(wsId);
      } catch (err) {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error:   err instanceof Error ? err.message : 'Failed to initialise workspace.',
        }));
      }
    })();

    return () => { cancelled = true; };
  }, [workspaceService, load]);

  // ── Add ──────────────────────────────────────────────────────────────────

  const addContributor = useCallback(
    async (input: Omit<CreateContributorInput, 'workspaceId'>): Promise<boolean> => {
      if (!state.workspaceId) return false;

      setState((s) => ({ ...s, submitting: true, submitError: null }));

      const result = await contributorService.addContributor(
        { ...input, workspaceId: state.workspaceId },
        DEMO_OWNER_ID,
      );

      if (isDomainError(result)) {
        setState((s) => ({
          ...s,
          submitting:  false,
          submitError: formatError(result),
        }));
        return false;
      }

      // Success — add optimistically to the list, then confirm with a reload
      setState((s) => ({
        ...s,
        contributors: [...s.contributors, result],
        submitting:   false,
        submitError:  null,
      }));

      // Log ContributorAdded
      (async () => {
        try {
          const workspace = await workspaceService.getWorkspaceById(state.workspaceId!);
          const wsName = (workspace && !isDomainError(workspace)) ? workspace.name : 'Unknown Workspace';
          const actId = session ? session.contributorId : DEMO_OWNER_ID;
          const actName = session ? session.name : 'Owner';
          const actRole = session ? session.role : 'Owner';
          await logEvent({
            message: `${actName} added ${result.name} as ${result.role}.`,
            workspace: {
              workspaceId: state.workspaceId!,
              workspaceName: wsName,
            },
            actor: {
              contributorId: actId,
              contributorName: actName,
              contributorRole: actRole,
            },
            event: {
              eventCode: 'ContributorAdded',
              eventLabel: 'Contributor Added',
            },
            entity: {
              entityType: 'Contributor',
              entityId: result.id,
              entityName: result.name,
            },
            state: {
              after: {
                id: result.id,
                workspaceId: result.workspaceId,
                name: result.name,
                email: result.email,
                role: result.role,
                status: result.status,
              },
            },
            details: {
              metadata: {
                email: result.email,
                role: result.role,
                invitedBy: actName,
              },
            },
          });
        } catch (e) {
          console.warn('Logging error:', e);
        }
      })();

      return true;
    },
    [contributorService, workspaceService, state.workspaceId, state.contributors, session],
  );

  // ── Archive ───────────────────────────────────────────────────────────────

  const archiveContributor = useCallback(
    async (id: string): Promise<boolean> => {
      if (!state.workspaceId) return false;

      const result = await contributorService.archiveContributor(id, DEMO_OWNER_ID);

      if (isDomainError(result)) {
        setState((s) => ({ ...s, submitError: formatError(result) }));
        return false;
      }

      // Update the archived contributor in the list in-place
      setState((s) => ({
        ...s,
        contributors: s.contributors.map((c) =>
          c.id === result.id ? result : c,
        ),
      }));

      // Log ContributorArchived
      (async () => {
        try {
          const workspace = await workspaceService.getWorkspaceById(state.workspaceId!);
          const wsName = (workspace && !isDomainError(workspace)) ? workspace.name : 'Unknown Workspace';
          const actId = session ? session.contributorId : DEMO_OWNER_ID;
          const actName = session ? session.name : 'Owner';
          const actRole = session ? session.role : 'Owner';
          await logEvent({
            message: `${actName} archived contributor ${result.name}.`,
            workspace: {
              workspaceId: state.workspaceId!,
              workspaceName: wsName,
            },
            actor: {
              contributorId: actId,
              contributorName: actName,
              contributorRole: actRole,
            },
            event: {
              eventCode: 'ContributorArchived',
              eventLabel: 'Contributor Archived',
            },
            entity: {
              entityType: 'Contributor',
              entityId: result.id,
              entityName: result.name,
            },
            state: {
              before: {
                status: 'Active',
              },
              after: {
                status: result.status,
              },
            },
            details: {
              metadata: {
                email: result.email,
                role: result.role,
                archivedBy: actName,
              },
            },
          });
        } catch (e) {
          console.warn('Logging error:', e);
        }
      })();

      return true;
    },
    [contributorService, workspaceService, state.workspaceId, state.contributors, session],
  );

  // ── Clear error ───────────────────────────────────────────────────────────

  const clearSubmitError = useCallback(() => {
    setState((s) => ({ ...s, submitError: null }));
  }, []);

  return {
    ...state,
    addContributor,
    archiveContributor,
    clearSubmitError,
  };
}
