import { useState, useEffect, useMemo } from 'react';
import { useSession } from '@app/SessionContext';
import { useServices } from '@hooks/useServices';
import { isDomainError } from '@lib/errors';
import { calculateOverallScore } from '@lib/scoring';
import {
  WorkspaceSnapshot,
  WorkspaceHealth,
  ContributorInsights,
  AssignmentInsights,
  MilestoneInsights,
  ReviewInsights,
  ActivityInsights,
} from '@features/analytics/AnalyticsComponents';
import { AssignmentStatus, ContributorStatus } from '@domain';
import type { Assignment, Contributor, Milestone, Review, Activity } from '@domain';
import { usePerformanceTracker } from '@infrastructure/logging';

export function AnalyticsPage() {
  const { session } = useSession();
  const {
    workspace: workspaceService,
    contributor: contributorService,
    assignment: assignmentService,
    milestone: milestoneService,
    review: reviewService,
    activity: activityService,
  } = useServices();

  const [loading, setLoading] = useState(true);
  usePerformanceTracker('Analytics', loading);

  const [error, setError] = useState<string | null>(null);

  // Raw data state
  const [workspace, setWorkspace] = useState<any>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Filter state
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d'>('all');
  const [selectedContributorId, setSelectedContributorId] = useState<string>('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');

  const loadData = async () => {
    if (!session?.workspaceId) return;
    try {
      setLoading(true);
      setError(null);

      // Concurrent fetch of all raw data
      const [
        wsResult,
        contributorsResult,
        assignmentsResult,
        milestonesResult,
        activitiesResult,
      ] = await Promise.all([
        workspaceService.getWorkspaceById(session.workspaceId),
        contributorService.getContributorsByWorkspace(session.workspaceId),
        assignmentService.getAssignmentsByWorkspace(session.workspaceId),
        milestoneService.getMilestonesByWorkspace(session.workspaceId),
        activityService.getActivitiesByWorkspace(session.workspaceId),
      ]);

      if (isDomainError(wsResult)) throw new Error('Failed to load workspace.');
      if (isDomainError(contributorsResult)) throw new Error('Failed to load contributors.');
      if (isDomainError(assignmentsResult)) throw new Error('Failed to load assignments.');
      if (isDomainError(milestonesResult)) throw new Error('Failed to load milestones.');
      if (isDomainError(activitiesResult)) throw new Error('Failed to load activity logs.');

      setWorkspace(wsResult);
      setContributors(contributorsResult);
      setAssignments(assignmentsResult);
      setMilestones(milestonesResult);
      setActivities(activitiesResult);

      // Load reviews for assignments concurrently
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
      setError(err.message || 'Failed to load workspace analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session?.workspaceId]);

  // Derived in-memory filters
  const filteredAssignments = useMemo(() => {
    let list = assignments;
    if (timeRange === '7d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      list = list.filter((a) => new Date(a.createdAt) >= cutoff);
    } else if (timeRange === '30d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      list = list.filter((a) => new Date(a.createdAt) >= cutoff);
    }
    if (selectedContributorId) {
      list = list.filter((a) => a.contributorId === selectedContributorId);
    }
    if (selectedMilestoneId) {
      list = list.filter((a) => a.milestoneId === selectedMilestoneId);
    }
    return list;
  }, [assignments, timeRange, selectedContributorId, selectedMilestoneId]);

  const filteredActivities = useMemo(() => {
    let list = activities;
    if (timeRange === '7d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      list = list.filter((a) => new Date(a.timestamp) >= cutoff);
    } else if (timeRange === '30d') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      list = list.filter((a) => new Date(a.timestamp) >= cutoff);
    }
    if (selectedContributorId) {
      list = list.filter(
        (a) => a.performedBy === selectedContributorId || a.contributorId === selectedContributorId
      );
    }
    if (selectedMilestoneId) {
      const mAssignmentIds = new Set(
        assignments.filter((a) => a.milestoneId === selectedMilestoneId).map((a) => a.id)
      );
      list = list.filter((a) => a.assignmentId && mAssignmentIds.has(a.assignmentId));
    }
    return list;
  }, [activities, timeRange, selectedContributorId, selectedMilestoneId, assignments]);

  const filteredReviews = useMemo(() => {
    // A review is in scope if its assignment is in the filtered list
    const activeAssignmentIds = new Set(filteredAssignments.map((a) => a.id));
    return reviews.filter((r) => activeAssignmentIds.has(r.assignmentId));
  }, [reviews, filteredAssignments]);

  // General metrics calculations
  const totalContributors = contributors.length;
  const activeContributors = contributors.filter((c) => c.status === ContributorStatus.Active).length;

  const activeAssignments = filteredAssignments.filter((a) =>
    [
      AssignmentStatus.Assigned,
      AssignmentStatus.Accepted,
      AssignmentStatus.InProgress,
      AssignmentStatus.RevisionRequested,
    ].includes(a.status)
  ).length;

  const completedAssignments = filteredAssignments.filter(
    (a) => a.status === AssignmentStatus.Completed
  ).length;

  const pendingReviews = filteredAssignments.filter((a) =>
    [
      AssignmentStatus.Submitted,
      AssignmentStatus.UnderReview,
      AssignmentStatus.Resubmitted,
    ].includes(a.status)
  ).length;

  const completionRate =
    filteredAssignments.length > 0
      ? Math.round((completedAssignments / filteredAssignments.length) * 100)
      : 0;

  const validScores = filteredReviews
    .map((r) => calculateOverallScore(r.scores).value)
    .filter((v) => v > 0);

  const avgReviewScore =
    validScores.length > 0
      ? Math.round((validScores.reduce((sum, v) => sum + v, 0) / validScores.length) * 10) / 10
      : 0;

  const overdueAssignments = filteredAssignments.filter(
    (a) =>
      ![AssignmentStatus.Completed, AssignmentStatus.Archived].includes(a.status) &&
      new Date(a.deadline) < new Date()
  ).length;

  const activeMilestonesCount = milestones.filter((m) => m.status !== 'Archived').length;

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 bg-surface-secondary min-h-[400px]">
        {/* Skeleton Snapshot */}
        <div className="card h-20 bg-surface animate-pulse" />
        {/* Skeleton Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="card h-16 bg-surface animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="p-6 bg-surface-secondary flex-1">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-red-800">Error Loading Analytics</h3>
          <p className="mt-1 text-xs text-red-700">{error || 'Workspace could not be found.'}</p>
          <button
            onClick={() => loadData()}
            className="mt-3 inline-flex items-center text-xs font-semibold text-red-800 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const lastUpdatedFormatted = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }) + ' • ' + new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="p-6 bg-surface-secondary flex-1 overflow-y-auto space-y-6">
      {/* 1. Workspace Snapshot */}
      <WorkspaceSnapshot
        workspaceName={workspace.name}
        totalContributors={totalContributors}
        activeAssignments={activeAssignments}
        activeMilestones={activeMilestonesCount}
        completionRate={completionRate}
        lastUpdated={lastUpdatedFormatted}
      />

      {/* Filter Controls Card */}
      <div className="card bg-surface flex flex-wrap items-center justify-between gap-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>Filters</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Time Range */}
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Time:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="bg-surface border border-border rounded px-2 py-1 text-text-primary focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Contributor filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Member:</span>
            <select
              value={selectedContributorId}
              onChange={(e) => setSelectedContributorId(e.target.value)}
              className="bg-surface border border-border rounded px-2 py-1 text-text-primary focus:outline-none max-w-[150px]"
            >
              <option value="">All Members</option>
              {contributors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Milestone filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted">Milestone:</span>
            <select
              value={selectedMilestoneId}
              onChange={(e) => setSelectedMilestoneId(e.target.value)}
              className="bg-surface border border-border rounded px-2 py-1 text-text-primary focus:outline-none max-w-[150px]"
            >
              <option value="">All Milestones</option>
              {milestones
                .filter((m) => m.status !== 'Archived')
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Workspace Health */}
      <WorkspaceHealth
        totalContributors={totalContributors}
        activeContributors={activeContributors}
        totalAssignments={filteredAssignments.length}
        completionRate={completionRate}
        avgReviewScore={avgReviewScore}
        pendingReviews={pendingReviews}
        overdueAssignments={overdueAssignments}
        activeMilestones={activeMilestonesCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 3. Contributor Insights */}
          <ContributorInsights
            contributors={contributors}
            assignments={filteredAssignments}
            reviews={reviews}
          />

          {/* 4. Assignment Insights */}
          <AssignmentInsights assignments={filteredAssignments} />

          {/* 6. Review Insights */}
          <ReviewInsights
            reviews={filteredReviews}
            contributors={contributors}
            activities={filteredActivities}
            assignments={assignments}
          />
        </div>

        <div className="space-y-6">
          {/* 5. Milestone Insights */}
          <MilestoneInsights milestones={milestones} assignments={assignments} />

          {/* 7. Activity Insights */}
          <ActivityInsights activities={filteredActivities} contributors={contributors} />
        </div>
      </div>
    </div>
  );
}
export default AnalyticsPage;
