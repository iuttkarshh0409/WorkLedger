/**
 * useSubmissions
 *
 * Manages submission state for a single Assignment.
 *
 * Responsibilities:
 * - Load full submission history for an assignment
 * - Submit work (In Progress → Submitted)
 * - Resubmit work (Revision Requested → Under Review)
 * - Expose loading, submitting, and error states
 *
 * Data flow:
 *   mount      → getSubmissionsByAssignment()
 *   submitWork → submitWork()     → optimistic prepend + assignment state update
 *   resubmit   → resubmitWork()  → optimistic prepend + assignment state update
 *
 * Caller is responsible for refreshing the parent Assignment after a
 * successful submission (the assignment's status will have changed).
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Submission,
  Assignment,
  CreateSubmissionInput,
  AnyDomainError,
  EntityId,
} from '@domain';
import type { ISubmissionService } from '@services/submission/ISubmissionService';
import type { IAssignmentService } from '@services/assignment/IAssignmentService';
import { isDomainError } from '@lib/errors';
import { DEMO_OWNER_ID } from '@lib/bootstrap';
import { useServices } from '@hooks/useServices';
import { logEvent } from '@infrastructure/logging';
import { useSession } from '@app/SessionContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseSubmissionsState {
  submissions:  Submission[];
  loading:      boolean;
  error:        string | null;
  submitting:   boolean;
  submitError:  string | null;
}

interface UseSubmissionsActions {
  /**
   * submitWork / resubmitWork return the updated Assignment on success (null on failure).
   * The caller (AssignmentsPage) uses the returned assignment to update its
   * in-memory list so the card status badge reflects the new lifecycle state
   * immediately without requiring a full page reload.
   */
  submitWork:       (input: Omit<CreateSubmissionInput, 'assignmentId' | 'submittedOn'>) => Promise<Assignment | null>;
  resubmitWork:     (input: Omit<CreateSubmissionInput, 'assignmentId' | 'submittedOn'>) => Promise<Assignment | null>;
  clearSubmitError: () => void;
}

export type UseSubmissionsResult = UseSubmissionsState & UseSubmissionsActions;

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

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSubmissions(
  assignmentId: EntityId | null,
  submissionService: ISubmissionService,
  assignmentService: IAssignmentService,
): UseSubmissionsResult {
  const { session } = useSession();
  const [state, setState] = useState<UseSubmissionsState>({
    submissions:  [],
    loading:      false,
    error:        null,
    submitting:   false,
    submitError:  null,
  });

  // ── Load ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!assignmentId) return;

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    submissionService
      .getSubmissionsByAssignment(assignmentId)
      .then((result) => {
        if (cancelled) return;
        if (isDomainError(result)) {
          setState((s) => ({ ...s, loading: false, error: formatError(result) }));
          return;
        }
        // Service returns ascending order (oldest first); reverse for display (newest first)
        setState((s) => ({
          ...s,
          submissions: [...result].reverse(),
          loading:     false,
          error:       null,
        }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error:   err instanceof Error ? err.message : 'Failed to load submissions.',
        }));
      });

    return () => { cancelled = true; };
  }, [assignmentId, submissionService]);

  const { workspace: workspaceService, contributor: contributorService, milestone: milestoneService } = useServices();

  // ── Submit / Resubmit shared logic ────────────────────────────────────────

  const doSubmit = useCallback(
    async (
      input: Omit<CreateSubmissionInput, 'assignmentId' | 'submittedOn'>,
      mode: 'submit' | 'resubmit',
    ): Promise<Assignment | null> => {
      if (!assignmentId) return null;

      setState((s) => ({ ...s, submitting: true, submitError: null }));

      const fullInput: CreateSubmissionInput = {
        ...input,
        assignmentId,
        submittedOn: new Date().toISOString(),
      };

      const actId = session ? session.contributorId : DEMO_OWNER_ID;
      const result =
        mode === 'submit'
          ? await submissionService.submitWork(fullInput, actId)
          : await submissionService.resubmitWork(fullInput, actId);

      if (isDomainError(result)) {
        setState((s) => ({
          ...s,
          submitting:  false,
          submitError: formatError(result),
        }));
        return null;
      }

      // Prepend newest submission to the top of the list
      setState((s) => ({
        ...s,
        submissions:  [result, ...s.submissions],
        submitting:   false,
        submitError:  null,
      }));

      // Fetch the refreshed assignment so the caller can sync its status
      const refreshed = await assignmentService.getAssignmentById(assignmentId);
      if (isDomainError(refreshed) || refreshed === null) return null;

      // Log SubmissionUploaded
      (async () => {
        try {
          const workspace = await workspaceService.getWorkspaceById(refreshed.workspaceId);
          const wsName = (workspace && !isDomainError(workspace)) ? workspace.name : 'Unknown Workspace';
          const actorResult = await contributorService.getContributorsByWorkspace(refreshed.workspaceId);
          
          const actName = session ? session.name : 'Contributor';
          const actRole = session ? session.role : 'Contributor';

          const reviewer = (actorResult && !isDomainError(actorResult)) ? actorResult.find(c => c.id === refreshed.reviewerId) : null;
          const reviewerName = reviewer ? reviewer.name : 'Unassigned';

          const milestone = refreshed.milestoneId ? await milestoneService.getMilestoneById(refreshed.milestoneId) : null;
          const milestoneName = (milestone && !isDomainError(milestone)) ? milestone.title : 'Unassigned';

          await logEvent({
            message: `${actName} uploaded submission for '${refreshed.title}'.`,
            workspace: {
              workspaceId: refreshed.workspaceId,
              workspaceName: wsName,
            },
            actor: {
              contributorId: actId,
              contributorName: actName,
              contributorRole: actRole,
            },
            event: {
              eventCode: 'SubmissionUploaded',
              eventLabel: 'Submission Uploaded',
              performedAction: mode === 'submit' ? 'submitWork' : 'resubmitWork',
            },
            entity: {
              entityType: 'Submission',
              entityId: result.id,
              entityName: `Submission for ${refreshed.title}`,
            },
            state: {
              before: {
                status: mode === 'submit' ? 'In Progress' : 'Revision Requested',
              },
              after: {
                title: refreshed.title,
                priority: refreshed.priority,
                status: refreshed.status,
                assignee: actName,
                reviewer: reviewerName,
                deadline: refreshed.deadline,
              },
            },
            details: {
              metadata: {
                priority: refreshed.priority,
                deadline: refreshed.deadline,
                assignee: actName,
                reviewer: reviewerName,
                milestone: milestoneName,
              },
            },
          });
        } catch (e) {
          console.warn('Logging error:', e);
        }
      })();

      return refreshed;
    },
    [assignmentId, submissionService, assignmentService, workspaceService, contributorService, milestoneService, session],
  );

  const submitWork = useCallback(
    (input: Omit<CreateSubmissionInput, 'assignmentId' | 'submittedOn'>) =>
      doSubmit(input, 'submit'),
    [doSubmit],
  );

  const resubmitWork = useCallback(
    (input: Omit<CreateSubmissionInput, 'assignmentId' | 'submittedOn'>) =>
      doSubmit(input, 'resubmit'),
    [doSubmit],
  );

  const clearSubmitError = useCallback(() => {
    setState((s) => ({ ...s, submitError: null }));
  }, []);

  return {
    ...state,
    submitWork,
    resubmitWork,
    clearSubmitError,
  };
}
