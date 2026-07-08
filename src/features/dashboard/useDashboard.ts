/**
 * useDashboard
 *
 * Loads and derives all data required by the Dashboard page.
 *
 * Data loaded in a single parallel fetch:
 *   - All assignments (for summary counts and pending work)
 *   - All contributors (for summary counts and display names)
 *   - All activities (for recent activity feed)
 *   - All reviews (for recent review cards with derived scores)
 *
 * All derived values are computed client-side from source data.
 * Nothing new is persisted.
 *
 * Data flow:
 *   mount → bootstrap → Promise.all([assignments, contributors, activities, reviews])
 *         → derive summary, pending, recentActivity, recentReviews
 */

import { useState, useEffect, useMemo } from 'react';
import type {
  Assignment,
  Contributor,
  Activity,
  Review,
  Milestone,
  AnyDomainError,
} from '@domain';
import { AssignmentStatus, ContributorStatus } from '@domain';
import type { IAssignmentService } from '@services/assignment/IAssignmentService';
import type { IContributorService } from '@services/contributor/IContributorService';
import type { IActivityService }    from '@services/activity/IActivityService';
import type { IReviewService }      from '@services/review/IReviewService';
import type { IWorkspaceService }   from '@services/workspace/IWorkspaceService';
import type { IMilestoneService }   from '@services/milestone/IMilestoneService';
import { isDomainError } from '@lib/errors';
import { calculateOverallScore } from '@lib/scoring';
import { getOrCreateDemoWorkspace } from '@lib/bootstrap';
import type { MilestoneProgress } from '@features/milestones/useMilestones';

// ─── Derived types ────────────────────────────────────────────────────────────

export interface WorkspaceSummary {
  totalContributors:   number;
  activeContributors:  number;
  activeAssignments:   number;
  completedAssignments:number;
  pendingReviews:      number;
}

export interface PendingItem {
  assignment:  Assignment;
  contributor: Contributor | undefined;
  isOverdue:   boolean;
}

export interface ReviewSummaryItem {
  review:      Review;
  assignment:  Assignment | undefined;
  contributor: Contributor | undefined;
  overallScore:number;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set<AssignmentStatus>([
  AssignmentStatus.Assigned,
  AssignmentStatus.Accepted,
  AssignmentStatus.InProgress,
  AssignmentStatus.Submitted,
  AssignmentStatus.UnderReview,
  AssignmentStatus.RevisionRequested,
  AssignmentStatus.Resubmitted,
]);

const AWAITING_SUBMISSION_STATUSES = new Set<AssignmentStatus>([
  AssignmentStatus.InProgress,
  AssignmentStatus.RevisionRequested,
]);

const AWAITING_REVIEW_STATUSES = new Set<AssignmentStatus>([
  AssignmentStatus.Submitted,
  AssignmentStatus.UnderReview,
]);

function isOverdue(assignment: Assignment): boolean {
  if (!ACTIVE_STATUSES.has(assignment.status)) return false;
  return new Date(assignment.deadline) < new Date();
}

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

// ─── Hook state ───────────────────────────────────────────────────────────────

interface UseDashboardState {
  loading:       boolean;
  error:         string | null;
  summary:       WorkspaceSummary;
  pendingWork:   {
    awaitingSubmission: PendingItem[];
    awaitingReview:     PendingItem[];
    overdue:            PendingItem[];
  };
  recentActivity:    Activity[];
  recentReviews:     ReviewSummaryItem[];
  contributors:      Contributor[];
  assignments:       Assignment[];
  milestones:        Milestone[];
  milestoneProgress: MilestoneProgress[];
}

export type UseDashboardResult = UseDashboardState;

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDashboard(
  workspaceService:   IWorkspaceService,
  assignmentService:  IAssignmentService,
  contributorService: IContributorService,
  activityService:    IActivityService,
  reviewService:      IReviewService,
  milestoneService:   IMilestoneService,
): UseDashboardResult {
  const [assignments,  setAssignments]  = useState<Assignment[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [activities,   setActivities]   = useState<Activity[]>([]);
  const [reviews,      setReviews]      = useState<Review[]>([]);
  const [milestones,   setMilestones]   = useState<Milestone[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const wsId = await getOrCreateDemoWorkspace(workspaceService);
        if (cancelled) return;

        const [aResult, cResult, actResult, mResult] = await Promise.all([
          assignmentService.getAssignmentsByWorkspace(wsId),
          contributorService.getContributorsByWorkspace(wsId),
          activityService.getActivitiesByWorkspace(wsId),
          milestoneService.getMilestonesByWorkspace(wsId),
        ]);

        if (cancelled) return;

        if (isDomainError(aResult))   { setError(formatError(aResult));   setLoading(false); return; }
        if (isDomainError(cResult))   { setError(formatError(cResult));   setLoading(false); return; }
        if (isDomainError(actResult)) { setError(formatError(actResult)); setLoading(false); return; }

        setAssignments(aResult);
        setContributors(cResult);
        setActivities(actResult);
        if (!isDomainError(mResult)) setMilestones(mResult);

        const completedIds = aResult
          .filter((a) => a.status === AssignmentStatus.Completed)
          .map((a) => a.id);

        if (completedIds.length > 0) {
          const reviewResults = await Promise.all(
            completedIds.map((id) => reviewService.getReviewsByAssignment(id)),
          );
          if (!cancelled) {
            const allReviews = reviewResults.flatMap((r) =>
              isDomainError(r) ? [] : r,
            );
            setReviews(allReviews);
          }
        }

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [workspaceService, assignmentService, contributorService, activityService, reviewService, milestoneService]);

  // ── Summary ───────────────────────────────────────────────────────────────

  const summary = useMemo<WorkspaceSummary>(() => ({
    totalContributors:    contributors.length,
    activeContributors:   contributors.filter((c) => c.status === ContributorStatus.Active).length,
    activeAssignments:    assignments.filter((a) => ACTIVE_STATUSES.has(a.status)).length,
    completedAssignments: assignments.filter((a) => a.status === AssignmentStatus.Completed).length,
    pendingReviews:       assignments.filter((a) => AWAITING_REVIEW_STATUSES.has(a.status)).length,
  }), [assignments, contributors]);

  // ── Pending work ──────────────────────────────────────────────────────────

  const pendingWork = useMemo(() => {
    const makeItem = (a: Assignment): PendingItem => ({
      assignment:  a,
      contributor: contributors.find((c) => c.id === a.contributorId),
      isOverdue:   isOverdue(a),
    });

    return {
      awaitingSubmission: assignments
        .filter((a) => AWAITING_SUBMISSION_STATUSES.has(a.status))
        .map(makeItem),
      awaitingReview: assignments
        .filter((a) => AWAITING_REVIEW_STATUSES.has(a.status))
        .map(makeItem),
      overdue: assignments
        .filter(isOverdue)
        .map(makeItem),
    };
  }, [assignments, contributors]);

  // ── Recent activity (newest first, max 10) ────────────────────────────────

  const recentActivity = useMemo(
    () => [...activities].reverse().slice(0, 10),
    [activities],
  );

  // ── Recent reviews (newest first, max 5 — skip revision-request records) ──

  const recentReviews = useMemo<ReviewSummaryItem[]>(() => {
    const assignmentMap = new Map(assignments.map((a) => [a.id, a]));
    const contributorMap = new Map(contributors.map((c) => [c.id, c]));

    return reviews
      .filter((r) => {
        // Exclude revision-request records (all-zero scores)
        const s = r.scores;
        return !(s.technicalQuality === 0 && s.documentation === 0 &&
                 s.communication === 0    && s.ownership === 0 &&
                 s.problemSolving === 0   && s.timeliness === 0);
      })
      .sort((a, b) => b.reviewedOn.localeCompare(a.reviewedOn))
      .slice(0, 5)
      .map((r) => {
        const assignment = assignmentMap.get(r.assignmentId);
        return {
          review:       r,
          assignment,
          contributor:  assignment
            ? contributorMap.get(assignment.contributorId)
            : undefined,
          overallScore: calculateOverallScore(r.scores).value,
        };
      });
  }, [reviews, assignments, contributors]);

  // ── Milestone progress ────────────────────────────────────────────────────

  const milestoneProgress = useMemo<MilestoneProgress[]>(() =>
    milestones.map((m) => {
      const linked = assignments.filter(
        (a) => a.milestoneId === m.id && a.status !== AssignmentStatus.Archived,
      );
      return {
        milestoneId: m.id,
        total:       linked.length,
        completed:   linked.filter((a) => a.status === AssignmentStatus.Completed).length,
      };
    }),
    [milestones, assignments],
  );

  return {
    loading,
    error,
    summary,
    pendingWork,
    recentActivity,
    recentReviews,
    contributors,
    assignments,
    milestones,
    milestoneProgress,
  };
}
