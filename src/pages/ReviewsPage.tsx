/**
 * ReviewsPage
 *
 * Connected container for the Reviewer Workflow and Review Lifecycle.
 * Displays assignments requiring reviewer attention, along with completed reviews.
 */

import { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { useServices } from '@hooks/useServices';
import { AccordionCard } from '@shared/components/AccordionCard';
import { ReviewActionPanel } from '@features/reviews/ReviewActionPanel';
import type { Assignment, Contributor, Submission, EntityId, AnyDomainError } from '@domain';
import { AssignmentStatus, AssignmentPriority, ContributorRole } from '@domain';
import { isDomainError } from '@lib/errors';
import { getOrCreateDemoWorkspace } from '@lib/bootstrap';
import { useSession } from '@app/SessionContext';
import { usePerformanceTracker } from '@infrastructure/logging';


function formatError(result: AnyDomainError): string {
  switch (result.kind) {
    case 'ValidationError': return result.errors.join(' ');
    case 'NotFoundError':   return `${result.entity} not found.`;
    case 'ConflictError':   return result.message;
    case 'PermissionError': return `Permission denied: ${result.reason}`;
    case 'DomainError':     return result.message;
  }
}

function statusBadgeClass(status: AssignmentStatus): string {
  switch (status) {
    case AssignmentStatus.Submitted:
      return 'bg-purple-50 text-purple-700 ring-purple-600/20';
    case AssignmentStatus.UnderReview:
      return 'bg-blue-50 text-blue-700 ring-blue-600/20';
    case AssignmentStatus.Resubmitted:
      return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';
    case AssignmentStatus.Completed:
      return 'bg-green-50 text-green-700 ring-green-600/20';
    default:
      return 'bg-surface-muted text-text-muted ring-border';
  }
}

function priorityClass(priority: AssignmentPriority): string {
  switch (priority) {
    case AssignmentPriority.Low:
      return 'text-green-600';
    case AssignmentPriority.Medium:
      return 'text-amber-600';
    case AssignmentPriority.High:
      return 'text-orange-600';
    case AssignmentPriority.Critical:
      return 'text-red-600 font-semibold';
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReviewsPage() {
  const {
    assignment: assignmentService,
    contributor: contributorService,
    submission: submissionService,
    workspace: workspaceService,
  } = useServices();

  const { session } = useSession();

  const [loading, setLoading] = useState(true);
  usePerformanceTracker('Reviews', loading);
  const [error, setError] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [latestSubmissions, setLatestSubmissions] = useState<Record<string, Submission>>({});
  const [expandedId, setExpandedId] = useState<EntityId | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const wsId = await getOrCreateDemoWorkspace(workspaceService);

      const [loadedAssignments, loadedContributors] = await Promise.all([
        assignmentService.getAssignmentsByWorkspace(wsId),
        contributorService.getContributorsByWorkspace(wsId),
      ]);

      if (isDomainError(loadedAssignments)) {
        setError(formatError(loadedAssignments));
        setLoading(false);
        return;
      }
      if (isDomainError(loadedContributors)) {
        setError(formatError(loadedContributors));
        setLoading(false);
        return;
      }

      // Fetch submissions for assignments requiring reviews
      const subPromises = loadedAssignments.map(async (a) => {
        const subs = await submissionService.getSubmissionsByAssignment(a.id);
        if (isDomainError(subs) || subs.length === 0) return null;
        return { assignmentId: a.id, submission: subs[subs.length - 1] };
      });

      const subsResults = await Promise.all(subPromises);
      const subsMap: Record<string, Submission> = {};
      subsResults.forEach((r) => {
        if (r) {
          subsMap[r.assignmentId] = r.submission;
        }
      });

      setAssignments(loadedAssignments);
      setContributors(loadedContributors);
      setLatestSubmissions(subsMap);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews data.');
    } finally {
      setLoading(false);
    }
  }, [workspaceService, assignmentService, contributorService, submissionService]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePanel = useCallback((id: EntityId) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleAssignmentUpdated = useCallback(
    (updated: Assignment) => {
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setExpandedId(null);
      loadData();
    },
    [loadData]
  );

  // Filter assignments based on reviewer ownership
  const visibleAssignments = assignments.filter((a) => {
    if (!session) return false;
    if (session.role === ContributorRole.Owner) return true;
    if (session.role === ContributorRole.Reviewer) {
      return a.reviewerId === session.contributorId;
    }
    return false;
  });

  // Split assignments
  const awaitingReview = visibleAssignments.filter((a) =>
    [AssignmentStatus.Submitted, AssignmentStatus.UnderReview, AssignmentStatus.Resubmitted].includes(
      a.status
    )
  );

  const completedReviews = visibleAssignments.filter((a) => a.status === AssignmentStatus.Completed);

  const renderCard = (assignment: Assignment) => {
    const contributor = contributors.find((c) => c.id === assignment.contributorId);
    const reviewer = contributors.find((c) => c.id === assignment.reviewerId);
    const submission = latestSubmissions[assignment.id];
    const isExpanded = expandedId === assignment.id;

    const cardHeader = (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start gap-3">
          <h3 className="text-sm font-semibold text-text-primary leading-snug">
            {assignment.title}
          </h3>
          <span className={clsx('rounded-md px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset', statusBadgeClass(assignment.status))}>
            {assignment.status}
          </span>
        </div>

        {submission && (
          <div className="text-[11px] text-text-secondary leading-normal bg-surface-muted/50 p-2 rounded border border-border/40 my-1">
            <span className="font-semibold text-text-primary block">Latest Submission:</span>
            <span className="line-clamp-1">{submission.description || 'No description provided'}</span>
            <span className="text-[10px] text-text-muted block mt-0.5">
              Submitted: {formatDate(submission.submittedOn)}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
          <span className={clsx('font-medium', priorityClass(assignment.priority))}>
            {assignment.priority}
          </span>
          <span className="flex items-center gap-1">
            Contributor: <strong className="text-text-secondary">{contributor?.name ?? 'Unassigned'}</strong>
          </span>
          <span className="flex items-center gap-1">
            Reviewer: <strong className="text-text-secondary">{reviewer?.name ?? 'Unassigned'}</strong>
          </span>
        </div>
      </div>
    );

    return (
      <AccordionCard
        key={assignment.id}
        open={isExpanded}
        onToggle={() => handleTogglePanel(assignment.id)}
        header={cardHeader}
      >
        {submission ? (
          <ReviewActionPanel
            assignment={assignment}
            submission={submission}
            onAssignmentUpdated={handleAssignmentUpdated}
            onCancel={() => setExpandedId(null)}
          />
        ) : (
          <div className="py-4 text-center text-xs text-text-muted">
            No submission payload found. Please check submissions tab.
          </div>
        )}
      </AccordionCard>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">Reviews Workspace</h2>
        <p className="page-description">
          Evaluate deliverables, score technical criteria, and transition work to completion.
        </p>
      </div>

      {loading && (
        <div role="status" aria-label="Loading review workspace" className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="card animate-pulse flex flex-col gap-3 h-28 bg-surface" />
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="card border-red-200 bg-red-50 text-sm text-red-700">
          <p className="font-semibold mb-1">Failed to load review workspace</p>
          <p className="text-xs">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8">
          {/* Awaiting Review section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Awaiting Review ({awaitingReview.length})
            </h3>
            {awaitingReview.length === 0 ? (
              <div className="card bg-surface/50 border border-dashed border-border py-8 text-center text-xs text-text-muted">
                All caught up! No assignments are currently awaiting review.
              </div>
            ) : (
              <div className="flex flex-col gap-3">{awaitingReview.map(renderCard)}</div>
            )}
          </div>

          {/* Completed Reviews section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Completed Reviews ({completedReviews.length})
            </h3>
            {completedReviews.length === 0 ? (
              <div className="card bg-surface/50 border border-dashed border-border py-8 text-center text-xs text-text-muted">
                No completed reviews in this workspace yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">{completedReviews.map(renderCard)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
