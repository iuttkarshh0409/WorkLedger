/**
 * AssignmentDetailPanel
 *
 * Expandable panel attached to an Assignment card.
 * Contains two tabs: Submissions and Reviews.
 *
 * This is the single area below a card that future milestones can extend
 * (Activity timeline, Attachments, etc.) without changing the page layout.
 *
 * Responsibilities:
 * - Own useSubmissions and useReviews for its assignmentId
 * - Manage the submit-work and review-form visibility
 * - Call onAssignmentUpdated when a submission or review transitions
 *   the assignment status, so the parent can sync its in-memory list
 *
 * @see docs/04_assignment_lifecycle.md (Lifecycle Overview)
 * @see docs/06.5_component_architecture.md (Layer 3 Feature Modules)
 */

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import type { Assignment, Contributor, Activity } from '@domain';
import { AssignmentStatus } from '@domain';

import { useSubmissions }       from '@features/submissions/useSubmissions';
import { SubmissionHistory }    from '@features/submissions/SubmissionHistory';
import { SubmissionEmptyState } from '@features/submissions/SubmissionEmptyState';
import { SubmitWorkDialog }     from '@features/submissions/SubmitWorkDialog';
import type { SubmitWorkFormValues, SubmissionMode } from '@features/submissions/SubmitWorkDialog';

import { useReviews }       from '@features/reviews/useReviews';
import { ReviewHistory }    from '@features/reviews/ReviewHistory';
import { ReviewEmptyState } from '@features/reviews/ReviewEmptyState';
import { ReviewForm }       from '@features/reviews/ReviewForm';

import type { ISubmissionService } from '@services/submission/ISubmissionService';
import type { IReviewService }     from '@services/review/IReviewService';
import type { IAssignmentService } from '@services/assignment/IAssignmentService';
import type { IActivityService }   from '@services/activity/IActivityService';

import { isDomainError }              from '@lib/errors';
import { formatRelativeTime, formatExactTime } from '@lib/time';

// ─── Inline Activity tab ──────────────────────────────────────────────────────

function ActivityTab({
  assignmentId,
  contributors,
  activityService,
}: {
  assignmentId:    string;
  contributors:    Contributor[];
  activityService: IActivityService;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    activityService.getActivitiesByAssignment(assignmentId)
      .then((result) => {
        if (cancelled) return;
        if (isDomainError(result)) {
          setError(result.kind === 'DomainError' ? result.message : 'Failed to load activity.');
          setLoading(false);
          return;
        }
        setActivities([...result].reverse());
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load activity.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [assignmentId, activityService]);

  if (loading) {
    return (
      <div className="animate-pulse flex flex-col gap-3" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-3 h-3 rounded-full bg-surface-muted mt-0.5 shrink-0"/>
            <div className="flex-1 flex flex-col gap-1.5 pb-4">
              <div className="h-2.5 w-36 rounded bg-surface-muted"/>
              <div className="h-2 w-24 rounded bg-surface-muted"/>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) return <p className="text-xs text-danger">{error}</p>;

  if (activities.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-xs text-text-muted">No activity recorded for this assignment yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {activities.map((activity, index) => {
        const actor = contributors.find((c) => c.id === activity.performedBy) ||
                      contributors.find((c) => c.id === activity.contributorId);
        return (
          <div key={activity.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-accent mt-1 shrink-0"/>
              {index < activities.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1"/>
              )}
            </div>
            <div className={clsx('flex-1 min-w-0', index < activities.length - 1 && 'pb-4')}>
              <p className="text-xs text-text-primary">{activity.type}</p>
              {actor && <p className="text-xs text-text-muted">by {actor.name}</p>}
              <time
                dateTime={activity.timestamp}
                title={formatExactTime(activity.timestamp)}
                className="text-xs text-text-muted"
              >
                {formatRelativeTime(activity.timestamp)}
              </time>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'submissions' | 'reviews' | 'activity';

interface AssignmentDetailPanelProps {
  assignment:          Assignment;
  contributors:        Contributor[];
  submissionService:   ISubmissionService;
  reviewService:       IReviewService;
  assignmentService:   IAssignmentService;
  activityService:     IActivityService;
  onAssignmentUpdated: (updated: Assignment) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function canSubmitWork(status: AssignmentStatus): boolean {
  return (
    status === AssignmentStatus.InProgress ||
    status === AssignmentStatus.RevisionRequested
  );
}

function canReview(status: AssignmentStatus): boolean {
  return (
    status === AssignmentStatus.Submitted ||
    status === AssignmentStatus.UnderReview
  );
}

function submissionMode(status: AssignmentStatus): SubmissionMode {
  return status === AssignmentStatus.RevisionRequested ? 'resubmit' : 'submit';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssignmentDetailPanel({
  assignment,
  contributors,
  submissionService,
  reviewService,
  assignmentService,
  activityService,
  onAssignmentUpdated,
}: AssignmentDetailPanelProps) {
  const [activeTab, setActiveTab]         = useState<Tab>('submissions');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [showReviewForm, setShowReviewForm]     = useState(false);

  // ── Submissions ─────────────────────────────────────────────────────────

  const {
    submissions,
    loading: subLoading,
    error:   subError,
    submitting: subSubmitting,
    submitError: subSubmitError,
    submitWork,
    resubmitWork,
    clearSubmitError: clearSubError,
  } = useSubmissions(assignment.id, submissionService, assignmentService);

  const latestSubmission = submissions[0] ?? null;

  const handleOpenSubmitDialog = () => {
    clearSubError();
    setSubmitDialogOpen(true);
  };

  const handleCloseSubmitDialog = () => {
    if (subSubmitting) return;
    clearSubError();
    setSubmitDialogOpen(false);
  };

  const handleSubmitWork = async (values: SubmitWorkFormValues) => {
    const fn = submissionMode(assignment.status) === 'resubmit' ? resubmitWork : submitWork;
    const updatedAssignment = await fn({
      description:      values.description.trim(),
      githubRepository: values.githubRepository.trim(),
      pullRequest:      values.pullRequest.trim(),
      demoLink:         values.demoLink.trim(),
      notes:            values.notes.trim(),
    });
    if (updatedAssignment) {
      onAssignmentUpdated(updatedAssignment);
      setSubmitDialogOpen(false);
    }
  };

  // ── Reviews ──────────────────────────────────────────────────────────────

  const {
    reviews,
    loading: revLoading,
    error:   revError,
    submitting: revSubmitting,
    submitError: revSubmitError,
    publishReview,
    requestRevision,
    clearSubmitError: clearRevError,
  } = useReviews(assignment.id, reviewService, assignmentService);

  const handlePublish = async (input: Parameters<typeof publishReview>[0]) => {
    const updatedAssignment = await publishReview(input);
    if (updatedAssignment) {
      onAssignmentUpdated(updatedAssignment);
      setShowReviewForm(false);
    }
  };

  const handleRequestRevision = async (input: Parameters<typeof requestRevision>[0]) => {
    const updatedAssignment = await requestRevision(input);
    if (updatedAssignment) {
      onAssignmentUpdated(updatedAssignment);
      setShowReviewForm(false);
    }
  };

  // ── Tab content ───────────────────────────────────────────────────────────

  const tabClass = (tab: Tab) =>
    clsx(
      'px-4 py-2 text-xs font-medium border-b-2 transition-colors duration-150',
      activeTab === tab
        ? 'border-accent text-accent'
        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border',
    );

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        <button type="button" className={tabClass('submissions')} onClick={() => setActiveTab('submissions')}>
          Submissions {submissions.length > 0 && `(${submissions.length})`}
        </button>
        <button type="button" className={tabClass('reviews')} onClick={() => setActiveTab('reviews')}>
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </button>
        <button type="button" className={tabClass('activity')} onClick={() => setActiveTab('activity')}>
          Activity
        </button>
      </div>

      {/* Tab content */}
      <div className="pt-4">

        {/* ── Submissions tab ── */}
        {activeTab === 'submissions' && (
          <>
            {subLoading && (
              <div className="animate-pulse flex flex-col gap-2">
                <div className="h-2.5 w-40 rounded bg-surface-muted" />
                <div className="h-2.5 w-full rounded bg-surface-muted" />
              </div>
            )}
            {subError && <p className="text-xs text-danger">{subError}</p>}
            {!subLoading && !subError && submissions.length === 0 && (
              <SubmissionEmptyState
                canSubmit={canSubmitWork(assignment.status)}
                onSubmit={handleOpenSubmitDialog}
              />
            )}
            {!subLoading && !subError && submissions.length > 0 && (
              <div className="flex flex-col gap-4">
                {canSubmitWork(assignment.status) && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleOpenSubmitDialog}
                      className={clsx(
                        'text-xs font-medium px-3 py-1.5 rounded-md',
                        'text-accent border border-accent hover:bg-accent-subtle',
                        'transition-colors duration-150',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                      )}
                    >
                      {assignment.status === AssignmentStatus.RevisionRequested ? 'Resubmit' : 'Submit work'}
                    </button>
                  </div>
                )}
                <SubmissionHistory submissions={submissions} />
              </div>
            )}
          </>
        )}

        {/* ── Reviews tab ── */}
        {activeTab === 'reviews' && (
          <>
            {revLoading && (
              <div className="animate-pulse flex flex-col gap-2">
                <div className="h-2.5 w-40 rounded bg-surface-muted" />
                <div className="h-2.5 w-full rounded bg-surface-muted" />
              </div>
            )}
            {revError && <p className="text-xs text-danger">{revError}</p>}

            {!revLoading && !revError && (
              <>
                {/* Review form */}
                {canReview(assignment.status) && showReviewForm ? (
                  <ReviewForm
                    submissionId={latestSubmission?.id ?? ''}
                    submitting={revSubmitting}
                    error={revSubmitError}
                    onPublish={handlePublish}
                    onRevision={handleRequestRevision}
                    onCancel={() => { clearRevError(); setShowReviewForm(false); }}
                  />
                ) : (
                  <>
                    {/* Write review CTA */}
                    {canReview(assignment.status) && !showReviewForm && latestSubmission && (
                      <div className="flex justify-end mb-4">
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(true)}
                          className={clsx(
                            'text-xs font-medium px-3 py-1.5 rounded-md',
                            'text-text-inverse bg-accent hover:bg-accent-hover',
                            'transition-colors duration-150',
                            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                          )}
                        >
                          Write review
                        </button>
                      </div>
                    )}

                    {reviews.length === 0 ? (
                      <ReviewEmptyState
                        canReview={canReview(assignment.status) && latestSubmission !== null}
                        onReview={() => setShowReviewForm(true)}
                      />
                    ) : (
                      <ReviewHistory reviews={reviews} contributors={contributors} />
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── Activity tab ── */}
        {activeTab === 'activity' && (
          <ActivityTab
            assignmentId={assignment.id}
            contributors={contributors}
            activityService={activityService}
          />
        )}
      </div>

      {/* Submit work dialog — rendered at panel level to avoid nesting issues */}
      <SubmitWorkDialog
        open={submitDialogOpen}
        mode={submissionMode(assignment.status)}
        submitting={subSubmitting}
        error={subSubmitError}
        onSubmit={handleSubmitWork}
        onClose={handleCloseSubmitDialog}
      />
    </div>
  );
}
