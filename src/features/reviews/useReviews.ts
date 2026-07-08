/**
 * useReviews
 *
 * Manages review state for a single Assignment.
 *
 * Responsibilities:
 * - Load all reviews for an assignment
 * - Publish a review (Submitted/Under Review → Completed)
 * - Request revision (Submitted/Under Review → Revision Requested)
 * - Return the updated Assignment after each operation so the caller
 *   can sync its in-memory assignment list immediately
 *
 * Data flow:
 *   mount          → getReviewsByAssignment()
 *   publishReview  → ReviewService.publishReview()  → Assignment → Completed
 *   requestRevision→ ReviewService.requestRevision() → Assignment → Revision Requested
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Review,
  Assignment,
  CreateReviewInput,
  ReviewScores,
  AnyDomainError,
  EntityId,
} from '@domain';
import type { IReviewService }     from '@services/review/IReviewService';
import type { IAssignmentService } from '@services/assignment/IAssignmentService';
import { isDomainError } from '@lib/errors';
import { calculateOverallScore } from '@lib/scoring';
import { DEMO_OWNER_ID } from '@lib/bootstrap';
import { useServices } from '@hooks/useServices';
import { logEvent } from '@infrastructure/logging';
import { useSession } from '@app/SessionContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublishReviewInput {
  submissionId: EntityId;
  scores:       ReviewScores;
  strengths:    string[];
  improvements: string[];
  feedback:     string;
}

export interface RequestRevisionInput {
  submissionId: EntityId;
  feedback:     string;
}

interface UseReviewsState {
  reviews:     Review[];
  loading:     boolean;
  error:       string | null;
  submitting:  boolean;
  submitError: string | null;
}

interface UseReviewsActions {
  publishReview:    (input: PublishReviewInput)    => Promise<Assignment | null>;
  requestRevision:  (input: RequestRevisionInput)  => Promise<Assignment | null>;
  clearSubmitError: () => void;
  /** Derived — exposed for convenience so the form doesn't recalculate. */
  deriveScore:      (scores: ReviewScores) => number;
}

export type UseReviewsResult = UseReviewsState & UseReviewsActions;

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

export function useReviews(
  assignmentId:      EntityId | null,
  reviewService:     IReviewService,
  assignmentService: IAssignmentService,
): UseReviewsResult {
  const [state, setState] = useState<UseReviewsState>({
    reviews:     [],
    loading:     false,
    error:       null,
    submitting:  false,
    submitError: null,
  });

  const { session } = useSession();
  const { workspace: workspaceService, contributor: contributorService, milestone: milestoneService } = useServices();

  // ── Load ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!assignmentId) return;

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    reviewService
      .getReviewsByAssignment(assignmentId)
      .then((result) => {
        if (cancelled) return;
        if (isDomainError(result)) {
          setState((s) => ({ ...s, loading: false, error: formatError(result) }));
          return;
        }
        setState((s) => ({
          ...s,
          reviews: result,
          loading: false,
          error:   null,
        }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error:   err instanceof Error ? err.message : 'Failed to load reviews.',
        }));
      });

    return () => { cancelled = true; };
  }, [assignmentId, reviewService]);

  // ── Publish review ────────────────────────────────────────────────────────

  const publishReview = useCallback(
    async (input: PublishReviewInput): Promise<Assignment | null> => {
      if (!assignmentId) return null;

      setState((s) => ({ ...s, submitting: true, submitError: null }));

      const actId = session ? session.contributorId : DEMO_OWNER_ID;
      const reviewInput: CreateReviewInput = {
        assignmentId,
        submissionId: input.submissionId,
        reviewedBy:   actId,
        reviewedOn:   new Date().toISOString(),
        scores:       input.scores,
        strengths:    input.strengths,
        improvements: input.improvements,
        feedback:     input.feedback,
      };

      const result = await reviewService.publishReview(reviewInput, actId);

      if (isDomainError(result)) {
        setState((s) => ({
          ...s,
          submitting:  false,
          submitError: formatError(result),
        }));
        return null;
      }

      setState((s) => ({
        ...s,
        reviews:     [...s.reviews, result],
        submitting:  false,
        submitError: null,
      }));

      // Fetch the updated assignment so the caller can sync its status
      const refreshed = await assignmentService.getAssignmentById(assignmentId);
      if (isDomainError(refreshed) || refreshed === null) return null;

      // Log ReviewPublished
      (async () => {
        try {
          const workspace = await workspaceService.getWorkspaceById(refreshed.workspaceId);
          const wsName = (workspace && !isDomainError(workspace)) ? workspace.name : 'Unknown Workspace';
          const actorResult = await contributorService.getContributorsByWorkspace(refreshed.workspaceId);
          
          const actName = session ? session.name : 'Reviewer';
          const actRole = session ? session.role : 'Reviewer';

          const assignee = (actorResult && !isDomainError(actorResult)) ? actorResult.find(c => c.id === refreshed.contributorId) : null;
          const assigneeName = assignee ? assignee.name : 'Unassigned';

          const milestone = refreshed.milestoneId ? await milestoneService.getMilestoneById(refreshed.milestoneId) : null;
          const milestoneName = (milestone && !isDomainError(milestone)) ? milestone.title : 'Unassigned';

          const score = calculateOverallScore(result.scores).value;

          await logEvent({
            message: `${actName} published review for '${refreshed.title}' with an overall score of ${score.toFixed(1)}.`,
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
              eventCode: 'AssignmentStatusChanged',
              eventLabel: 'Assignment Status Changed',
              performedAction: 'publishReview',
            },
            entity: {
              entityType: 'Review',
              entityId: result.id,
              entityName: `Review for ${refreshed.title}`,
            },
            state: {
              before: {
                status: 'Submitted',
              },
              after: {
                title: refreshed.title,
                priority: refreshed.priority,
                status: refreshed.status,
                assignee: assigneeName,
                reviewer: actName,
                deadline: refreshed.deadline,
              },
            },
            details: {
              metadata: {
                priority: refreshed.priority,
                deadline: refreshed.deadline,
                assignee: assigneeName,
                reviewer: actName,
                milestone: milestoneName,
                overallScore: score,
                feedback: result.feedback,
              },
            },
          });
        } catch (e) {
          console.warn('Logging error:', e);
        }
      })();

      return refreshed;
    },
    [assignmentId, reviewService, assignmentService, workspaceService, contributorService, milestoneService, session],
  );

  // ── Request revision ──────────────────────────────────────────────────────

  const requestRevision = useCallback(
    async (input: RequestRevisionInput): Promise<Assignment | null> => {
      if (!assignmentId) return null;

      setState((s) => ({ ...s, submitting: true, submitError: null }));

      const actId = session ? session.contributorId : DEMO_OWNER_ID;
      const result = await reviewService.requestRevision(
        assignmentId,
        input.submissionId,
        input.feedback,
        actId,
      );

      if (isDomainError(result)) {
        setState((s) => ({
          ...s,
          submitting:  false,
          submitError: formatError(result),
        }));
        return null;
      }

      setState((s) => ({
        ...s,
        reviews:     [...s.reviews, result],
        submitting:  false,
        submitError: null,
      }));

      const refreshed = await assignmentService.getAssignmentById(assignmentId);
      if (isDomainError(refreshed) || refreshed === null) return null;

      // Log RevisionRequested
      (async () => {
        try {
          const workspace = await workspaceService.getWorkspaceById(refreshed.workspaceId);
          const wsName = (workspace && !isDomainError(workspace)) ? workspace.name : 'Unknown Workspace';
          const actorResult = await contributorService.getContributorsByWorkspace(refreshed.workspaceId);
          
          const actName = session ? session.name : 'Reviewer';
          const actRole = session ? session.role : 'Reviewer';

          const assignee = (actorResult && !isDomainError(actorResult)) ? actorResult.find(c => c.id === refreshed.contributorId) : null;
          const assigneeName = assignee ? assignee.name : 'Unassigned';

          const milestone = refreshed.milestoneId ? await milestoneService.getMilestoneById(refreshed.milestoneId) : null;
          const milestoneName = (milestone && !isDomainError(milestone)) ? milestone.title : 'Unassigned';

          await logEvent({
            message: `${actName} requested revisions for '${refreshed.title}'.`,
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
              eventCode: 'AssignmentStatusChanged',
              eventLabel: 'Assignment Status Changed',
              performedAction: 'requestRevision',
            },
            entity: {
              entityType: 'Review',
              entityId: result.id,
              entityName: `Revision Request for ${refreshed.title}`,
            },
            state: {
              before: {
                status: 'Submitted',
              },
              after: {
                title: refreshed.title,
                priority: refreshed.priority,
                status: refreshed.status,
                assignee: assigneeName,
                reviewer: actName,
                deadline: refreshed.deadline,
              },
            },
            details: {
              metadata: {
                priority: refreshed.priority,
                deadline: refreshed.deadline,
                assignee: assigneeName,
                reviewer: actName,
                milestone: milestoneName,
                feedback: result.feedback,
              },
            },
          });
        } catch (e) {
          console.warn('Logging error:', e);
        }
      })();

      return refreshed;
    },
    [assignmentId, reviewService, assignmentService, workspaceService, contributorService, milestoneService, session],
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  const clearSubmitError = useCallback(() => {
    setState((s) => ({ ...s, submitError: null }));
  }, []);

  const deriveScore = useCallback(
    (scores: ReviewScores) => calculateOverallScore(scores).value,
    [],
  );

  return {
    ...state,
    publishReview,
    requestRevision,
    clearSubmitError,
    deriveScore,
  };
}
