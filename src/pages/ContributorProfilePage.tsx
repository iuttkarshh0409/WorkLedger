import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useServices } from '@hooks/useServices';
import { isDomainError } from '@lib/errors';
import { calculateOverallScore, getPerformanceRating } from '@lib/scoring';
import {
  AssignmentStatus,
  AssignmentPriority,
  ContributorRole,
  ContributorStatus,
} from '@domain';
import type { Assignment, Contributor, Review, Activity, AnyDomainError } from '@domain';
import { ActivityTimeline } from '@features/activity/ActivityTimeline';
import { ReviewHistory } from '@features/reviews/ReviewHistory';
import { clsx } from 'clsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleLabel(role: ContributorRole): string {
  return role;
}

function statusConfig(status: ContributorStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case ContributorStatus.Active:
      return { label: 'Active', className: 'bg-green-50 text-green-700 ring-green-600/20' };
    case ContributorStatus.Inactive:
      return { label: 'Inactive', className: 'bg-surface-muted text-text-secondary ring-border' };
    case ContributorStatus.Archived:
      return { label: 'Archived', className: 'bg-surface-muted text-text-muted ring-border' };
  }
}

function assignmentStatusConfig(status: AssignmentStatus): { label: string; className: string } {
  switch (status) {
    case AssignmentStatus.Draft:
      return { label: 'Draft', className: 'bg-surface-muted text-text-muted ring-border' };
    case AssignmentStatus.Assigned:
      return { label: 'Assigned', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' };
    case AssignmentStatus.Accepted:
      return { label: 'Accepted', className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' };
    case AssignmentStatus.InProgress:
      return { label: 'In Progress', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' };
    case AssignmentStatus.Submitted:
      return { label: 'Submitted', className: 'bg-purple-50 text-purple-700 ring-purple-600/20' };
    case AssignmentStatus.UnderReview:
      return { label: 'Under Review', className: 'bg-purple-50 text-purple-700 ring-purple-600/20' };
    case AssignmentStatus.RevisionRequested:
      return { label: 'Revision Requested', className: 'bg-orange-50 text-orange-700 ring-orange-600/20' };
    case AssignmentStatus.Resubmitted:
      return { label: 'Resubmitted', className: 'bg-purple-50 text-purple-700 ring-purple-600/20' };
    case AssignmentStatus.Completed:
      return { label: 'Completed', className: 'bg-green-50 text-green-700 ring-green-600/20' };
    case AssignmentStatus.Archived:
      return { label: 'Archived', className: 'bg-surface-muted text-text-muted ring-border' };
  }
}

function priorityConfig(priority: AssignmentPriority): { label: string; className: string } {
  switch (priority) {
    case AssignmentPriority.Low:
      return { label: 'Low', className: 'text-green-600' };
    case AssignmentPriority.Medium:
      return { label: 'Medium', className: 'text-amber-600' };
    case AssignmentPriority.High:
      return { label: 'High', className: 'text-orange-600' };
    case AssignmentPriority.Critical:
      return { label: 'Critical', className: 'text-red-600 font-semibold' };
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(deadline: string, status: AssignmentStatus): boolean {
  const terminal: AssignmentStatus[] = [AssignmentStatus.Completed, AssignmentStatus.Archived];
  return !terminal.includes(status) && new Date(deadline) < new Date();
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatDomainError(error: AnyDomainError): string {
  switch (error.kind) {
    case 'ValidationError':
      return error.errors.join(', ');
    case 'NotFoundError':
      return `${error.entity} with ID ${error.id} was not found.`;
    case 'ConflictError':
      return error.message;
    case 'PermissionError':
      return `Permission Denied for ${error.action}: ${error.reason}`;
    case 'DomainError':
      return error.message;
    default:
      return 'An unexpected error occurred.';
  }
}

// ─── Lightweight Read-Only Card ────────────────────────────────────────────────

interface AssignmentLedgerCardProps {
  assignment: Assignment;
  reviewerName?: string;
}

function AssignmentLedgerCard({ assignment, reviewerName }: AssignmentLedgerCardProps) {
  const status = assignmentStatusConfig(assignment.status);
  const priority = priorityConfig(assignment.priority);
  const overdue = isOverdue(assignment.deadline, assignment.status);
  const isArchived = assignment.status === AssignmentStatus.Archived;

  return (
    <div className={clsx('card flex flex-col gap-2.5', isArchived && 'opacity-60')}>
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-xs font-semibold text-text-primary leading-snug flex-1 min-w-0">
          {assignment.title || '—'}
        </h4>
        <span
          className={clsx(
            'shrink-0 inline-flex items-center rounded-md px-1.5 py-0.5',
            'text-[10px] font-medium ring-1 ring-inset',
            status.className
          )}
        >
          {status.label}
        </span>
      </div>

      {assignment.description && (
        <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
          {assignment.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
        <span className={clsx('font-medium', priority.className)}>{priority.label}</span>

        {reviewerName && (
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={10}
              height={10}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Reviewer: {reviewerName}
          </span>
        )}

        <span className={clsx('flex items-center gap-1', overdue && 'text-danger font-medium')}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={10}
            height={10}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {overdue ? 'Overdue · ' : ''}
          {formatDate(assignment.deadline)}
        </span>

        {assignment.revisionCount > 0 && (
          <span className="flex items-center gap-1 text-orange-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={10}
              height={10}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-4" />
            </svg>
            {assignment.revisionCount} revision{assignment.revisionCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContributorProfilePage() {
  const { contributorId } = useParams<{ contributorId: string }>();
  const {
    contributor: contributorService,
    workspace: workspaceService,
    assignment: assignmentService,
    activity: activityService,
    review: reviewService,
  } = useServices();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [contributor, setContributor] = useState<Contributor | null>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);

  // Tab State for Ledger
  const [activeTab, setActiveTab] = useState<'active' | 'awaiting' | 'completed'>('active');

  const loadData = async () => {
    if (!contributorId) return;
    try {
      setLoading(true);
      setError(null);

      // Load core contributor record
      const contributorResult = await contributorService.getContributorById(contributorId);
      if (isDomainError(contributorResult)) {
        throw new Error(formatDomainError(contributorResult));
      }
      if (!contributorResult) {
        throw new Error('Contributor not found.');
      }
      setContributor(contributorResult);

      const workspaceId = contributorResult.workspaceId;

      // Parallel fetching for remaining datasets
      const [workspaceResult, assignmentsResult, activitiesResult, contributorsResult] =
        await Promise.all([
          workspaceService.getWorkspaceById(workspaceId),
          assignmentService.getAssignmentsByContributor(workspaceId, contributorId),
          activityService.getActivitiesByContributor(workspaceId, contributorId),
          contributorService.getContributorsByWorkspace(workspaceId),
        ]);

      if (isDomainError(workspaceResult)) throw new Error(formatDomainError(workspaceResult));
      if (isDomainError(assignmentsResult)) throw new Error(formatDomainError(assignmentsResult));
      if (isDomainError(activitiesResult)) throw new Error(formatDomainError(activitiesResult));
      if (isDomainError(contributorsResult)) throw new Error(formatDomainError(contributorsResult));

      setWorkspace(workspaceResult);
      setAssignments(assignmentsResult);
      setActivities(activitiesResult);
      setContributors(contributorsResult);

      // Fetch reviews for all assignments assigned to the contributor
      const reviewsResult = await Promise.all(
        assignmentsResult.map((a) => reviewService.getReviewsByAssignment(a.id))
      );

      const resolvedReviews: Review[] = [];
      reviewsResult.forEach((res) => {
        if (!isDomainError(res)) {
          resolvedReviews.push(...res);
        }
      });
      setReviews(resolvedReviews);
    } catch (err: any) {
      setError(err.message || 'Failed to load contributor profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [contributorId]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-surface-secondary min-h-[400px]">
        <div className="text-sm text-text-muted animate-pulse font-medium">
          Loading contributor profile...
        </div>
      </div>
    );
  }

  if (error || !contributor) {
    return (
      <div className="p-6 bg-surface-secondary flex-1">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-red-800">Error Loading Profile</h3>
          <p className="mt-1 text-xs text-red-700">{error || 'Contributor could not be found.'}</p>
          <Link
            to="/contributors"
            className="mt-3 inline-flex items-center text-xs font-semibold text-red-800 hover:underline"
          >
            &larr; Back to contributors
          </Link>
        </div>
      </div>
    );
  }

  // Derive Metrics
  const activeAssignments = assignments.filter((a) =>
    [
      AssignmentStatus.Assigned,
      AssignmentStatus.Accepted,
      AssignmentStatus.InProgress,
      AssignmentStatus.RevisionRequested,
    ].includes(a.status)
  );

  const completedAssignments = assignments.filter(
    (a) => a.status === AssignmentStatus.Completed
  );

  const pendingReviews = assignments.filter((a) =>
    [
      AssignmentStatus.Submitted,
      AssignmentStatus.UnderReview,
      AssignmentStatus.Resubmitted,
    ].includes(a.status)
  );

  // Completion rate calculation: Completed / Total assignments ever assigned
  const totalAssigned = assignments.length;
  const completionRate =
    totalAssigned > 0 ? Math.round((completedAssignments.length / totalAssigned) * 100) : 0;

  // Average review score derivation
  const validOverallScores = reviews
    .map((r) => calculateOverallScore(r.scores).value)
    .filter((v) => v > 0);
  const avgReviewScore =
    validOverallScores.length > 0
      ? Math.round((validOverallScores.reduce((sum, v) => sum + v, 0) / validOverallScores.length) * 10) / 10
      : 0;

  // Workload count by priority
  const workload = {
    Critical: activeAssignments.filter((a) => a.priority === AssignmentPriority.Critical).length,
    High: activeAssignments.filter((a) => a.priority === AssignmentPriority.High).length,
    Medium: activeAssignments.filter((a) => a.priority === AssignmentPriority.Medium).length,
    Low: activeAssignments.filter((a) => a.priority === AssignmentPriority.Low).length,
  };

  // Grouped assignments for Ledger tabs
  const tabAssignments = {
    active: activeAssignments,
    awaiting: pendingReviews,
    completed: completedAssignments,
  };

  const statusInfo = statusConfig(contributor.status);

  return (
    <div className="p-6 bg-surface-secondary flex-1 overflow-y-auto space-y-6">
      {/* Navigation breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Link to="/contributors" className="hover:text-text-secondary transition-colors">
          Contributors
        </Link>
        <span>/</span>
        <span className="text-text-primary font-medium">{contributor.name}</span>
      </div>

      {/* Profile Info Header */}
      <div className="card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent-subtle text-accent text-lg font-bold shrink-0 select-none">
            {contributor.avatar ? (
              <img
                src={contributor.avatar}
                alt={`${contributor.name} avatar`}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              initials(contributor.name)
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-text-primary">{contributor.name}</h2>
              <span
                className={clsx(
                  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                  statusInfo.className
                )}
              >
                {statusInfo.label}
              </span>
            </div>
            <p className="text-xs text-text-secondary">{contributor.email}</p>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{roleLabel(contributor.role)}</span>
              <span>·</span>
              <span>Workspace: {workspace?.name || '—'}</span>
              {contributor.joinedAt && (
                <>
                  <span>·</span>
                  <span>Joined {formatDate(contributor.joinedAt)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards & Workload Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Performance Summaries */}
        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-surface rounded-lg p-4 border border-border flex flex-col justify-between">
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
              Active Tasks
            </span>
            <span className="text-xl font-bold text-text-primary mt-2">
              {activeAssignments.length}
            </span>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-border flex flex-col justify-between">
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
              Completed Tasks
            </span>
            <span className="text-xl font-bold text-text-primary mt-2">
              {completedAssignments.length}
            </span>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-border flex flex-col justify-between">
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
              Pending Review
            </span>
            <span className="text-xl font-bold text-text-primary mt-2">
              {pendingReviews.length}
            </span>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-border flex flex-col justify-between">
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
              Performance Score
            </span>
            <div className="flex flex-col items-start gap-1 mt-2">
              <span className="text-xl font-bold text-text-primary">
                {avgReviewScore > 0 ? `${avgReviewScore} / 10` : '—'}
              </span>
              {avgReviewScore > 0 && (
                <span className={clsx("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset", getPerformanceRating(avgReviewScore).colorClass)}>
                  <span className={clsx("h-1 w-1 rounded-full", getPerformanceRating(avgReviewScore).dotColorClass)} />
                  <span>{getPerformanceRating(avgReviewScore).label}</span>
                </span>
              )}
            </div>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-border flex flex-col justify-between">
            <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
              Completion Rate
            </span>
            <span className="text-xl font-bold text-text-primary mt-2">{completionRate}%</span>
          </div>
        </div>

        {/* Current Workload priorities widget */}
        <div className="card space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-text-primary">Current Workload</h3>
            <p className="text-[10px] text-text-muted">Active assignments by priority</p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-border/50 pb-1">
              <span className="text-red-600 font-semibold">Critical</span>
              <span className="font-bold text-text-primary">{workload.Critical}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-1">
              <span className="text-orange-600 font-medium">High</span>
              <span className="font-bold text-text-primary">{workload.High}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border/50 pb-1">
              <span className="text-amber-600">Medium</span>
              <span className="font-bold text-text-primary">{workload.Medium}</span>
            </div>
            <div className="flex items-center justify-between pb-1">
              <span className="text-green-600">Low</span>
              <span className="font-bold text-text-primary">{workload.Low}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment Ledger column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-sm font-semibold text-text-primary">Assignment Ledger</h3>
            <div className="flex gap-2 text-xs">
              {(['active', 'awaiting', 'completed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'px-2.5 py-1 rounded transition-colors',
                    activeTab === tab
                      ? 'bg-accent text-white font-semibold'
                      : 'text-text-secondary hover:bg-surface-muted'
                  )}
                >
                  {tab === 'active'
                    ? 'Active'
                    : tab === 'awaiting'
                    ? 'Awaiting Review'
                    : 'Completed'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {tabAssignments[activeTab].length === 0 ? (
              <div className="bg-surface rounded-lg border border-border p-6 text-center text-xs text-text-muted">
                No assignments in this category.
              </div>
            ) : (
              tabAssignments[activeTab].map((assignment) => {
                const reviewer = contributors.find((c) => c.id === assignment.reviewerId);
                return (
                  <AssignmentLedgerCard
                    key={assignment.id}
                    assignment={assignment}
                    reviewerName={reviewer?.name}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Review history & Activity Timeline */}
        <div className="space-y-6">
          {/* Review History */}
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-2">
              Reviews Received
            </h3>
            {reviews.length === 0 ? (
              <div className="text-xs text-text-muted py-4 text-center">
                No reviews received yet.
              </div>
            ) : (
              <ReviewHistory reviews={reviews} contributors={contributors} />
            )}
          </div>

          {/* Activity Timeline */}
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-text-primary border-b border-border pb-2">
              Recent Activity
            </h3>
            {activities.length === 0 ? (
              <div className="text-xs text-text-muted py-4 text-center">
                No recorded activity events.
              </div>
            ) : (
              <ActivityTimeline
                activities={[...activities].reverse()} // Show newest first
                contributors={contributors}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
