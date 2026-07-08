/**
 * useAssignments
 *
 * Manages assignment state for the Assignments page.
 *
 * Responsibilities:
 * - Bootstrap demo workspace
 * - Load assignments and contributors for the workspace
 * - Create new assignments
 * - Execute lifecycle transitions: acceptAssignment, startAssignment, archiveAssignment
 * - Apply client-side filters (status, priority, contributor, search)
 * - Expose loading, error, and submitting states
 *
 * Data flow:
 *   mount  → bootstrap → getAssignmentsByWorkspace + getContributorsByWorkspace
 *   create → createAssignment()     → optimistic list update
 *   accept → acceptAssignment()     → in-place list update
 *   start  → startAssignment()      → in-place list update
 *   archive→ archiveAssignment()    → in-place list update
 *   filter → derived from assignments + filters (no service call)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Assignment,
  Contributor,
  CreateAssignmentInput,
  AssignmentStatus,
  AssignmentPriority,
  AnyDomainError,
  EntityId,
} from '@domain';
import type { IAssignmentService } from '@services/assignment/IAssignmentService';
import type { IContributorService } from '@services/contributor/IContributorService';
import type { IWorkspaceService }   from '@services/workspace/IWorkspaceService';
import { isDomainError } from '@lib/errors';
import { getOrCreateDemoWorkspace, DEMO_OWNER_ID } from '@lib/bootstrap';
import { logEvent } from '@infrastructure/logging';
import { useSession } from '@app/SessionContext';
import { useServices } from '@hooks/useServices';

// ─── Filter types ─────────────────────────────────────────────────────────────

export interface AssignmentFilters {
  search:        string;
  status:        AssignmentStatus | '';
  priority:      AssignmentPriority | '';
  contributorId: EntityId | '';
}

export const DEFAULT_FILTERS: AssignmentFilters = {
  search:        '',
  status:        '',
  priority:      '',
  contributorId: '',
};

// ─── State types ──────────────────────────────────────────────────────────────

interface UseAssignmentsState {
  assignments:         Assignment[];
  filteredAssignments: Assignment[];
  contributors:        Contributor[];
  workspaceId:         string | null;
  filters:             AssignmentFilters;
  loading:             boolean;
  error:               string | null;
  submitting:          boolean;
  submitError:         string | null;
}

interface UseAssignmentsActions {
  createAssignment:  (input: Omit<CreateAssignmentInput, 'workspaceId' | 'assignedOn'>) => Promise<boolean>;
  acceptAssignment:  (id: EntityId) => Promise<boolean>;
  startAssignment:   (id: EntityId) => Promise<boolean>;
  archiveAssignment: (id: EntityId) => Promise<boolean>;
  /**
   * updateAssignment
   *
   * Pushes an externally-updated Assignment into the list in-place.
   * Used by AssignmentsPage after a submission transitions assignment status —
   * the SubmissionService updates the assignment in storage; this propagates
   * that change back to the in-memory list without a full reload.
   */
  updateAssignment:  (updated: Assignment) => void;
  setFilters:        (filters: Partial<AssignmentFilters>) => void;
  clearSubmitError:  () => void;
}

export type UseAssignmentsResult = UseAssignmentsState & UseAssignmentsActions;

// ─── Error formatting ─────────────────────────────────────────────────────────

function formatError(result: AnyDomainError): string {
  switch (result.kind) {
    case 'ValidationError': return result.errors.join(' ');
    case 'NotFoundError':   return `${result.entity} not found.`;
    case 'ConflictError':   return result.message;
    case 'PermissionError': return `Permission denied: ${result.reason}`;
    case 'DomainError':     return result.message;
  }
}

// ─── Filter logic ─────────────────────────────────────────────────────────────

function applyFilters(
  assignments: Assignment[],
  filters: AssignmentFilters,
): Assignment[] {
  let result = assignments;

  if (filters.status) {
    result = result.filter((a) => a.status === filters.status);
  }
  if (filters.priority) {
    result = result.filter((a) => a.priority === filters.priority);
  }
  if (filters.contributorId) {
    result = result.filter((a) => a.contributorId === filters.contributorId);
  }
  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter((a) => a.title.toLowerCase().includes(q));
  }

  return result;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAssignments(
  assignmentService:  IAssignmentService,
  contributorService: IContributorService,
  workspaceService:   IWorkspaceService,
  initialStatus:      AssignmentStatus | '' = '',
): UseAssignmentsResult {
  const { session } = useSession();
  const { milestone: milestoneService } = useServices();
  const [state, setState] = useState<Omit<UseAssignmentsState, 'filteredAssignments'>>({
    assignments:  [],
    contributors: [],
    workspaceId:  null,
    filters:      { ...DEFAULT_FILTERS, status: initialStatus },
    loading:      true,
    error:        null,
    submitting:   false,
    submitError:  null,
  });

  // Derived — no extra state
  const filteredAssignments = useMemo(
    () => applyFilters(state.assignments, state.filters),
    [state.assignments, state.filters],
  );

  // ── Load ─────────────────────────────────────────────────────────────────

  const load = useCallback(async (wsId: string) => {
    const [aResult, cResult] = await Promise.all([
      assignmentService.getAssignmentsByWorkspace(wsId),
      contributorService.getContributorsByWorkspace(wsId),
    ]);

    if (isDomainError(aResult)) {
      setState((s) => ({ ...s, loading: false, error: formatError(aResult) }));
      return;
    }
    if (isDomainError(cResult)) {
      setState((s) => ({ ...s, loading: false, error: formatError(cResult) }));
      return;
    }

    setState((s) => ({
      ...s,
      assignments:  aResult,
      contributors: cResult,
      loading:      false,
      error:        null,
    }));
  }, [assignmentService, contributorService]);

  // ── Bootstrap + initial load ─────────────────────────────────────────────

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
          error: err instanceof Error ? err.message : 'Failed to initialise workspace.',
        }));
      }
    })();
    return () => { cancelled = true; };
  }, [workspaceService, load]);

  // ── Update helper — replaces one assignment in the list in-place ──────────

  const updateInList = useCallback((updated: Assignment) => {
    setState((s) => ({
      ...s,
      submitting:  false,
      submitError: null,
      assignments: s.assignments.map((a) => a.id === updated.id ? updated : a),
    }));
  }, []);

  // ── Create ───────────────────────────────────────────────────────────────

  const createAssignment = useCallback(
    async (input: Omit<CreateAssignmentInput, 'workspaceId' | 'assignedOn'>): Promise<boolean> => {
      if (!state.workspaceId) return false;
      setState((s) => ({ ...s, submitting: true, submitError: null }));

      const createResult = await assignmentService.createAssignment(
        {
          ...input,
          workspaceId: state.workspaceId,
          assignedOn:  new Date().toISOString(),
        },
        DEMO_OWNER_ID,
      );

      if (isDomainError(createResult)) {
        setState((s) => ({ ...s, submitting: false, submitError: formatError(createResult) }));
        return false;
      }

      let result = createResult;

      // Automatically transition from Draft to Assigned
      if (result.status === 'Draft' && result.contributorId) {
        const assignResult = await assignmentService.assignContributor(
          result.id,
          result.contributorId,
          DEMO_OWNER_ID,
        );
        if (!isDomainError(assignResult)) {
          result = assignResult;
        }
      }

      setState((s) => ({
        ...s,
        assignments:  [...s.assignments, result],
        submitting:   false,
        submitError:  null,
      }));

      // Log AssignmentCreated
      (async () => {
        try {
          const workspace = await workspaceService.getWorkspaceById(state.workspaceId!);
          const wsName = (workspace && !isDomainError(workspace)) ? workspace.name : 'Unknown Workspace';
          
          const actId = session ? session.contributorId : DEMO_OWNER_ID;
          const actName = session ? session.name : 'Owner';
          const actRole = session ? session.role : 'Owner';

          const assignee = state.contributors.find((c) => c.id === result.contributorId);
          const assigneeName = assignee ? assignee.name : 'Unassigned';

          const reviewer = state.contributors.find((c) => c.id === result.reviewerId);
          const reviewerName = reviewer ? reviewer.name : 'Unassigned';

          const milestone = result.milestoneId ? await milestoneService.getMilestoneById(result.milestoneId) : null;
          const milestoneName = (milestone && !isDomainError(milestone)) ? milestone.title : 'Unassigned';

          await logEvent({
            message: `${actName} created assignment '${result.title}' and assigned it to ${assigneeName} with ${result.priority} priority.`,
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
              eventCode: 'AssignmentCreated',
              eventLabel: 'Assignment Created',
            },
            entity: {
              entityType: 'Assignment',
              entityId: result.id,
              entityName: result.title,
            },
            state: {
              after: {
                title: result.title,
                priority: result.priority,
                status: result.status,
                assignee: assigneeName,
                reviewer: reviewerName,
                deadline: result.deadline,
              },
            },
            details: {
              metadata: {
                priority: result.priority,
                deadline: result.deadline,
                assignee: assigneeName,
                reviewer: reviewerName,
                milestone: milestoneName,
              },
            },
          });
        } catch (e) {
          console.warn('Logging error:', e);
        }
      })();

      return true;
    },
    [assignmentService, workspaceService, milestoneService, state.workspaceId, state.contributors, session],
  );

  // ── Lifecycle transitions ─────────────────────────────────────────────────

  const acceptAssignment = useCallback(async (id: EntityId): Promise<boolean> => {
    const actId = session ? session.contributorId : DEMO_OWNER_ID;
    const result = await assignmentService.acceptAssignment(id, actId);
    if (isDomainError(result)) {
      setState((s) => ({ ...s, submitError: formatError(result) }));
      return false;
    }
    updateInList(result);

    // Log AssignmentAccepted
    (async () => {
      try {
        const workspace = await workspaceService.getWorkspaceById(state.workspaceId!);
        const wsName = (workspace && !isDomainError(workspace)) ? workspace.name : 'Unknown Workspace';
        const actName = session ? session.name : 'Contributor';
        const actRole = session ? session.role : 'Contributor';

        const assignee = state.contributors.find((c) => c.id === result.contributorId);
        const assigneeName = assignee ? assignee.name : 'Unassigned';

        const reviewer = state.contributors.find((c) => c.id === result.reviewerId);
        const reviewerName = reviewer ? reviewer.name : 'Unassigned';

        const milestone = result.milestoneId ? await milestoneService.getMilestoneById(result.milestoneId) : null;
        const milestoneName = (milestone && !isDomainError(milestone)) ? milestone.title : 'Unassigned';

        await logEvent({
          message: `${actName} accepted assignment '${result.title}'.`,
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
            eventCode: 'AssignmentStatusChanged',
            eventLabel: 'Assignment Status Changed',
            performedAction: 'acceptAssignment',
          },
          entity: {
            entityType: 'Assignment',
            entityId: result.id,
            entityName: result.title,
          },
          state: {
            before: {
              status: 'Assigned',
            },
            after: {
              title: result.title,
              priority: result.priority,
              status: result.status,
              assignee: assigneeName,
              reviewer: reviewerName,
              deadline: result.deadline,
            },
          },
          details: {
            metadata: {
              priority: result.priority,
              deadline: result.deadline,
              assignee: assigneeName,
              reviewer: reviewerName,
              milestone: milestoneName,
            },
          },
        });
      } catch (e) {
        console.warn('Logging error:', e);
      }
    })();

    return true;
  }, [assignmentService, workspaceService, milestoneService, state.workspaceId, state.contributors, session, updateInList]);

  const startAssignment = useCallback(async (id: EntityId): Promise<boolean> => {
    const actId = session ? session.contributorId : DEMO_OWNER_ID;
    const result = await assignmentService.startAssignment(id, actId);
    if (isDomainError(result)) {
      setState((s) => ({ ...s, submitError: formatError(result) }));
      return false;
    }
    updateInList(result);

    // Log AssignmentStarted
    (async () => {
      try {
        const workspace = await workspaceService.getWorkspaceById(state.workspaceId!);
        const wsName = (workspace && !isDomainError(workspace)) ? workspace.name : 'Unknown Workspace';
        const actName = session ? session.name : 'Contributor';
        const actRole = session ? session.role : 'Contributor';

        const assignee = state.contributors.find((c) => c.id === result.contributorId);
        const assigneeName = assignee ? assignee.name : 'Unassigned';

        const reviewer = state.contributors.find((c) => c.id === result.reviewerId);
        const reviewerName = reviewer ? reviewer.name : 'Unassigned';

        const milestone = result.milestoneId ? await milestoneService.getMilestoneById(result.milestoneId) : null;
        const milestoneName = (milestone && !isDomainError(milestone)) ? milestone.title : 'Unassigned';

        await logEvent({
          message: `${actName} started working on assignment '${result.title}'.`,
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
            eventCode: 'AssignmentStatusChanged',
            eventLabel: 'Assignment Status Changed',
            performedAction: 'startAssignment',
          },
          entity: {
            entityType: 'Assignment',
            entityId: result.id,
            entityName: result.title,
          },
          state: {
            before: {
              status: 'Accepted',
            },
            after: {
              title: result.title,
              priority: result.priority,
              status: result.status,
              assignee: assigneeName,
              reviewer: reviewerName,
              deadline: result.deadline,
            },
          },
          details: {
            metadata: {
              priority: result.priority,
              deadline: result.deadline,
              assignee: assigneeName,
              reviewer: reviewerName,
              milestone: milestoneName,
            },
          },
        });
      } catch (e) {
        console.warn('Logging error:', e);
      }
    })();

    return true;
  }, [assignmentService, workspaceService, milestoneService, state.workspaceId, state.contributors, session, updateInList]);

  const archiveAssignment = useCallback(async (id: EntityId): Promise<boolean> => {
    const actId = session ? session.contributorId : DEMO_OWNER_ID;
    const result = await assignmentService.archiveAssignment(id, actId);
    if (isDomainError(result)) {
      setState((s) => ({ ...s, submitError: formatError(result) }));
      return false;
    }
    updateInList(result);
    return true;
  }, [assignmentService, session, updateInList]);

  // ── External update (e.g. after submission status transition) ────────────

  const updateAssignment = useCallback((updated: Assignment) => {
    updateInList(updated);
  }, [updateInList]);

  // ── Filters ───────────────────────────────────────────────────────────────
  const setFilters = useCallback((partial: Partial<AssignmentFilters>) => {
    setState((s) => ({ ...s, filters: { ...s.filters, ...partial } }));
  }, []);

  // ── Clear error ───────────────────────────────────────────────────────────

  const clearSubmitError = useCallback(() => {
    setState((s) => ({ ...s, submitError: null }));
  }, []);

  return {
    ...state,
    filteredAssignments,
    createAssignment,
    acceptAssignment,
    startAssignment,
    archiveAssignment,
    updateAssignment,
    setFilters,
    clearSubmitError,
  };
}
