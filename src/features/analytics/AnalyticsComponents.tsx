import { useState } from 'react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';
import type {
  Assignment,
  Contributor,
  Milestone,
  Review,
  Activity,
} from '@domain';
import {
  AssignmentStatus,
  AssignmentPriority,
  ActivityType,
} from '@domain';
import { ProgressBar } from '@shared/components/ProgressBar';
import { calculateOverallScore } from '@lib/scoring';
import { contributorProfilePath, assignmentsWithFilter } from '@shared/constants/routes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Component 1: WorkspaceSnapshot ──────────────────────────────────────────

interface WorkspaceSnapshotProps {
  workspaceName: string;
  totalContributors: number;
  activeAssignments: number;
  activeMilestones: number;
  completionRate: number;
  lastUpdated: string;
}

export function WorkspaceSnapshot({
  workspaceName,
  totalContributors,
  activeAssignments,
  activeMilestones,
  completionRate,
  lastUpdated,
}: WorkspaceSnapshotProps) {
  return (
    <div className="card bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-text-primary">Workspace Snapshot</h2>
        <h3 className="text-sm font-semibold text-accent">{workspaceName}</h3>
      </div>
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex flex-col">
          <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Contributors</span>
          <span className="text-text-primary font-bold text-base">{totalContributors}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Active Tasks</span>
          <span className="text-text-primary font-bold text-base">{activeAssignments}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Active Milestones</span>
          <span className="text-text-primary font-bold text-base">{activeMilestones}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Completion Rate</span>
          <span className="text-text-primary font-bold text-base">{completionRate}%</span>
        </div>
        <div className="flex flex-col text-right border-l border-border pl-4">
          <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Last Updated</span>
          <span className="text-text-secondary text-xs font-medium">{lastUpdated}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Component 2: WorkspaceHealth ─────────────────────────────────────────────

interface WorkspaceHealthProps {
  totalContributors: number;
  activeContributors: number;
  totalAssignments: number;
  completionRate: number;
  avgReviewScore: number;
  pendingReviews: number;
  overdueAssignments: number;
  activeMilestones: number;
}

export function WorkspaceHealth({
  totalContributors,
  activeContributors,
  totalAssignments,
  completionRate,
  avgReviewScore,
  pendingReviews,
  overdueAssignments,
  activeMilestones,
}: WorkspaceHealthProps) {
  const cards = [
    { label: 'Total Contributors', value: totalContributors, to: '/contributors' },
    { label: 'Active Contributors', value: activeContributors, to: '/contributors', success: true },
    { label: 'Total Assignments', value: totalAssignments, to: '/assignments' },
    { label: 'Completion Rate', value: `${completionRate}%` },
    { label: 'Avg Review Score', value: avgReviewScore > 0 ? `${avgReviewScore} / 5` : '—' },
    { label: 'Pending Reviews', value: pendingReviews, warning: pendingReviews > 0, to: assignmentsWithFilter('Submitted') },
    { label: 'Overdue Assignments', value: overdueAssignments, danger: overdueAssignments > 0 },
    { label: 'Active Milestones', value: activeMilestones, to: '/milestones' },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Workspace Health</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c, idx) => {
          const content = (
            <>
              <span
                className={clsx(
                  'text-lg font-bold',
                  c.success && 'text-green-600',
                  c.warning && 'text-amber-500',
                  c.danger && 'text-red-500'
                )}
              >
                {c.value}
              </span>
              <span className="text-[11px] text-text-secondary leading-tight mt-1">{c.label}</span>
            </>
          );
          if (c.to) {
            return (
              <Link
                key={idx}
                to={c.to}
                className="card bg-surface flex flex-col justify-between hover:border-accent-hover hover:shadow-sm transition-all duration-150"
              >
                {content}
              </Link>
            );
          }
          return (
            <div key={idx} className="card bg-surface flex flex-col justify-between">
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component 3: ContributorInsights ──────────────────────────────────────────

interface ContributorInsightsProps {
  contributors: Contributor[];
  assignments: Assignment[];
  reviews: Review[];
}

export function ContributorInsights({
  contributors,
  assignments,
  reviews,
}: ContributorInsightsProps) {
  const [sortKey, setSortKey] = useState<'completed' | 'avgScore' | 'completionRate'>('completed');

  const contributorData = contributors.map((c) => {
    const cAssignments = assignments.filter((a) => a.contributorId === c.id);
    const completed = cAssignments.filter((a) => a.status === AssignmentStatus.Completed).length;
    const active = cAssignments.filter((a) =>
      [
        AssignmentStatus.Assigned,
        AssignmentStatus.Accepted,
        AssignmentStatus.InProgress,
        AssignmentStatus.RevisionRequested,
      ].includes(a.status)
    ).length;

    // Resolve reviews received
    const cReviews = reviews.filter((r) => {
      const assignment = assignments.find((a) => a.id === r.assignmentId);
      return assignment?.contributorId === c.id;
    });
    const scores = cReviews
      .map((r) => calculateOverallScore(r.scores).value)
      .filter((v) => v > 0);
    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((sum, v) => sum + v, 0) / scores.length) * 10) / 10
        : 0;

    const completionRate =
      cAssignments.length > 0 ? Math.round((completed / cAssignments.length) * 100) : 0;

    return {
      id: c.id,
      name: c.name,
      role: c.role,
      completed,
      active,
      avgScore,
      completionRate,
      workload: active,
    };
  });

  const sortedData = [...contributorData].sort((a, b) => {
    if (sortKey === 'avgScore') {
      return b.avgScore - a.avgScore || b.completed - a.completed;
    }
    if (sortKey === 'completionRate') {
      return b.completionRate - a.completionRate || b.completed - a.completed;
    }
    return b.completed - a.completed || b.avgScore - a.avgScore;
  });

  return (
    <div className="card bg-surface space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Contributor Insights</h3>
          <p className="text-[11px] text-text-muted mt-0.5">Performance overview of active members.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-muted">Sort by:</span>
          {(['completed', 'avgScore', 'completionRate'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortKey(key)}
              className={clsx(
                'px-2 py-1 rounded transition-colors',
                sortKey === key
                  ? 'bg-accent text-white font-semibold'
                  : 'text-text-secondary hover:bg-surface-muted'
              )}
            >
              {key === 'completed'
                ? 'Completed Tasks'
                : key === 'avgScore'
                ? 'Avg Score'
                : 'Completion Rate'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-text-muted font-semibold">
              <th className="py-2 pr-4 font-semibold">Contributor</th>
              <th className="py-2 px-2 text-center font-semibold">Completed</th>
              <th className="py-2 px-2 text-center font-semibold">Active</th>
              <th className="py-2 px-2 text-center font-semibold">Avg Score</th>
              <th className="py-2 px-2 text-center font-semibold">Completion Rate</th>
              <th className="py-2 pl-4 text-center font-semibold">Current Workload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sortedData.map((d) => (
              <tr key={d.id} className="hover:bg-surface-muted/40">
                <td className="py-3 pr-4 font-medium text-text-primary">
                  <Link
                    to={contributorProfilePath(d.id)}
                    className="hover:text-accent hover:underline font-semibold"
                  >
                    {d.name}
                  </Link>
                  <span className="block text-[10px] text-text-muted font-normal">{d.role}</span>
                </td>
                <td className="py-3 px-2 text-center text-text-primary font-medium">{d.completed}</td>
                <td className="py-3 px-2 text-center text-text-secondary">{d.active}</td>
                <td className="py-3 px-2 text-center font-semibold text-text-primary">
                  {d.avgScore > 0 ? `${d.avgScore} / 5` : '—'}
                </td>
                <td className="py-3 px-2 text-center text-text-secondary">{d.completionRate}%</td>
                <td className="py-3 pl-4 text-center">
                  <span
                    className={clsx(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      d.workload > 3
                        ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                        : d.workload > 1
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                        : 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                    )}
                  >
                    {d.workload} active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Component 4: AssignmentInsights ───────────────────────────────────────────

interface AssignmentInsightsProps {
  assignments: Assignment[];
}

export function AssignmentInsights({ assignments }: AssignmentInsightsProps) {
  const total = assignments.length;

  // 1. Status Distribution
  const statuses = [
    { key: AssignmentStatus.Draft, label: 'Draft', color: 'bg-surface-muted' },
    { key: AssignmentStatus.Assigned, label: 'Assigned', color: 'bg-blue-500' },
    { key: AssignmentStatus.Accepted, label: 'Accepted', color: 'bg-indigo-500' },
    { key: AssignmentStatus.InProgress, label: 'In Progress', color: 'bg-amber-500' },
    {
      key: [
        AssignmentStatus.Submitted,
        AssignmentStatus.UnderReview,
        AssignmentStatus.Resubmitted,
      ],
      label: 'Under Review',
      color: 'bg-purple-500',
    },
    { key: AssignmentStatus.Completed, label: 'Completed', color: 'bg-green-500' },
  ];

  const statusDistribution = statuses.map((s) => {
    const count = assignments.filter((a) =>
      Array.isArray(s.key) ? s.key.includes(a.status) : a.status === s.key
    ).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return { ...s, count, pct };
  });

  // 2. Priority Distribution
  const priorities = [
    { key: AssignmentPriority.Critical, label: 'Critical', textClass: 'text-red-600' },
    { key: AssignmentPriority.High, label: 'High', textClass: 'text-orange-600' },
    { key: AssignmentPriority.Medium, label: 'Medium', textClass: 'text-amber-600' },
    { key: AssignmentPriority.Low, label: 'Low', textClass: 'text-green-600' },
  ];

  const priorityDistribution = priorities.map((p) => {
    const count = assignments.filter((a) => a.priority === p.key).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return { ...p, count, pct };
  });

  // 3. Age Buckets
  const now = new Date();
  const ages = assignments.map((a) => {
    const created = new Date(a.createdAt);
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
  });

  const avgAge = ages.length > 0 ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : 0;

  const ageBuckets = [
    { label: '< 7 Days', filter: (age: number) => age < 7 },
    { label: '7–30 Days', filter: (age: number) => age >= 7 && age <= 30 },
    { label: '> 30 Days', filter: (age: number) => age > 30 },
  ];

  const bucketCounts = ageBuckets.map((b) => {
    const count = ages.filter(b.filter).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return { ...b, count, pct };
  });

  // 4. Overdue vs On-Time
  const overdueCount = assignments.filter(
    (a) =>
      ![AssignmentStatus.Completed, AssignmentStatus.Archived].includes(a.status) &&
      new Date(a.deadline) < now
  ).length;
  const onTimeCount = total - overdueCount;

  return (
    <div className="card bg-surface space-y-6">
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-semibold text-text-primary">Assignment Insights</h3>
        <p className="text-[11px] text-text-muted mt-0.5">Visual distribution of tasks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Status Distribution */}
        <div className="space-y-3">
          <h4 className="font-semibold text-text-primary border-b border-border/50 pb-1">Status Distribution</h4>
          <div className="space-y-2">
            {statusDistribution.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="font-medium text-text-secondary">{s.label}</span>
                  <span className="text-text-muted">
                    {s.count} ({s.pct}%)
                  </span>
                </div>
                <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden border border-border/40">
                  <div className={clsx('h-full rounded-full', s.color)} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priorities & Age Info */}
        <div className="space-y-6">
          {/* Priority Distribution */}
          <div className="space-y-2">
            <h4 className="font-semibold text-text-primary border-b border-border/50 pb-1">Priority Distribution</h4>
            <div className="grid grid-cols-2 gap-3">
              {priorityDistribution.map((p, idx) => (
                <div key={idx} className="bg-surface-secondary rounded border border-border p-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={clsx('font-semibold', p.textClass)}>{p.label}</span>
                    <span className="text-text-primary font-bold">{p.count}</span>
                  </div>
                  <div className="text-[10px] text-text-muted mt-1">{p.pct}% of total</div>
                </div>
              ))}
            </div>
          </div>

          {/* Age Buckets & Overdue */}
          <div className="space-y-3">
            <h4 className="font-semibold text-text-primary border-b border-border/50 pb-1">Duration Metrics</h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Avg Age */}
              <div className="bg-surface-secondary rounded border border-border p-3 flex flex-col justify-between">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
                  Avg Active Task Age
                </span>
                <span className="text-lg font-bold text-text-primary mt-1">{avgAge} Days</span>
              </div>

              {/* Overdue Ratio */}
              <div className="bg-surface-secondary rounded border border-border p-3 flex flex-col justify-between">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Status Ratio</span>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <div>
                    <span className="text-red-500 font-bold">{overdueCount}</span> Overdue
                  </div>
                  <div>
                    <span className="text-green-600 font-bold">{onTimeCount}</span> Active/Done
                  </div>
                </div>
              </div>
            </div>

            {/* Age Buckets list */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Age Distribution</span>
              <div className="grid grid-cols-3 gap-2">
                {bucketCounts.map((b, idx) => (
                  <div key={idx} className="text-center bg-surface-secondary p-1 border border-border/50 rounded">
                    <span className="block text-[10px] text-text-secondary">{b.label}</span>
                    <span className="text-xs font-bold text-text-primary">
                      {b.count} ({b.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component 5: MilestoneInsights ────────────────────────────────────────────

interface MilestoneInsightsProps {
  milestones: Milestone[];
  assignments: Assignment[];
}

export function MilestoneInsights({ milestones, assignments }: MilestoneInsightsProps) {
  const activeMilestones = milestones.filter(
    (m) => m.status !== 'Archived' // using inline status check
  );

  const getMilestoneHealth = (m: Milestone, total: number, completed: number, remaining: number) => {
    const now = new Date();
    const deadline = new Date(m.deadline);
    const completionPct = total > 0 ? (completed / total) * 100 : 0;

    if (completionPct === 100) {
      return { label: 'Completed', className: 'bg-green-50 text-green-700 ring-green-600/20' };
    }
    if (deadline < now) {
      return { label: 'At Risk (Overdue)', className: 'bg-red-50 text-red-700 ring-red-600/20' };
    }
    // If deadline is less than 3 days away and remaining is substantial
    const daysLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 3 && completionPct < 50 && remaining > 0) {
      return { label: 'At Risk', className: 'bg-red-50 text-red-700 ring-red-600/20' };
    }
    return { label: 'On Track', className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' };
  };

  return (
    <div className="card bg-surface space-y-4">
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-semibold text-text-primary">Milestone Insights</h3>
        <p className="text-[11px] text-text-muted mt-0.5">Real-time status of active milestones.</p>
      </div>

      <div className="space-y-4">
        {activeMilestones.length === 0 ? (
          <div className="text-xs text-text-muted py-6 text-center">
            No active milestones in this workspace.
          </div>
        ) : (
          activeMilestones.map((m) => {
            const mAssignments = assignments.filter((a) => a.milestoneId === m.id);
            const total = mAssignments.length;
            const completed = mAssignments.filter((a) => a.status === AssignmentStatus.Completed).length;
            const remaining = total - completed;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
            const health = getMilestoneHealth(m, total, completed, remaining);

            return (
              <div key={m.id} className="space-y-2 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-start flex-wrap gap-2 text-xs">
                  <div>
                    <h4 className="font-semibold text-text-primary leading-tight">{m.title}</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      Deadline: {formatDate(m.deadline)} · {remaining} remaining
                    </p>
                  </div>
                  <span className={clsx('rounded px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset', health.className)}>
                    {health.label}
                  </span>
                </div>
                <div className="space-y-1">
                  <ProgressBar value={completed} max={total} />
                  <div className="flex justify-between text-[10px] text-text-secondary">
                    <span>{progress}% complete</span>
                    <span>
                      {completed} / {total} Tasks
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Component 6: ReviewInsights ───────────────────────────────────────────────

interface ReviewInsightsProps {
  reviews: Review[];
  contributors: Contributor[];
  activities: Activity[];
  assignments: Assignment[];
}

export function ReviewInsights({
  reviews,
  contributors,
  activities,
  assignments,
}: ReviewInsightsProps) {
  const publishedCount = reviews.length;

  const validScores = reviews
    .map((r) => calculateOverallScore(r.scores).value)
    .filter((v) => v > 0);

  const avgWorkspaceScore =
    validScores.length > 0
      ? Math.round((validScores.reduce((sum, v) => sum + v, 0) / validScores.length) * 10) / 10
      : 0;

  // Average turnaround time (Submission -> Review Published)
  // Derive pairs from the Workspace Activity stream
  const submissionEvents = activities.filter((a) => a.type === ActivityType.SubmissionUploaded);
  const reviewEvents = activities.filter((a) => a.type === ActivityType.ReviewPublished);

  const turnaroundTimes = reviewEvents.map((r) => {
    // Find latest submission for same assignment that occurred before review
    const matchingSubmissions = submissionEvents.filter(
      (s) => s.assignmentId === r.assignmentId && new Date(s.timestamp) < new Date(r.timestamp)
    );
    if (matchingSubmissions.length === 0) return null;
    const latestSub = matchingSubmissions.reduce((latest, current) =>
      new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
    );

    const reviewTime = new Date(r.timestamp).getTime();
    const subTime = new Date(latestSub.timestamp).getTime();
    return (reviewTime - subTime) / (1000 * 60 * 60 * 24); // in days
  }).filter((t): t is number => t !== null && t >= 0);

  const avgTurnaround =
    turnaroundTimes.length > 0
      ? Math.round((turnaroundTimes.reduce((sum, t) => sum + t, 0) / turnaroundTimes.length) * 10) / 10
      : 0;

  // Highest / Lowest Rated Contributors
  const contributorStats = contributors.map((c) => {
    const cAssignments = assignments.filter((a) => a.contributorId === c.id);
    const cReviews = reviews.filter((r) =>
      cAssignments.some((a) => a.id === r.assignmentId)
    );
    const scores = cReviews
      .map((r) => calculateOverallScore(r.scores).value)
      .filter((v) => v > 0);

    const avg =
      scores.length > 0
        ? Math.round((scores.reduce((sum, v) => sum + v, 0) / scores.length) * 10) / 10
        : 0;

    return { name: c.name, avg, count: scores.length };
  }).filter((c) => c.count > 0);

  const highestContributor =
    contributorStats.length > 0
      ? [...contributorStats].reduce((max, current) => (current.avg > max.avg ? current : max))
      : null;

  const lowestContributor =
    contributorStats.length > 0
      ? [...contributorStats].reduce((min, current) => (current.avg < min.avg ? current : min))
      : null;

  // Revision requests
  const revisionRequests = activities.filter((a) => a.type === ActivityType.RevisionRequested).length;

  // Score distribution counts
  const scoreBuckets = [
    { label: 'Excellent (4.5–5.0)', filter: (s: number) => s >= 4.5 && s <= 5.0 },
    { label: 'Proficient (3.5–4.4)', filter: (s: number) => s >= 3.5 && s < 4.5 },
    { label: 'Developing (2.5–3.4)', filter: (s: number) => s >= 2.5 && s < 3.5 },
    { label: 'Unsatisfactory (< 2.5)', filter: (s: number) => s < 2.5 },
  ];

  const distribution = scoreBuckets.map((b) => {
    const count = validScores.filter(b.filter).length;
    const pct = validScores.length > 0 ? Math.round((count / validScores.length) * 100) : 0;
    return { ...b, count, pct };
  });

  return (
    <div className="card bg-surface space-y-6">
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-semibold text-text-primary">Review Insights</h3>
        <p className="text-[11px] text-text-muted mt-0.5">Derived code review metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Core Review metrics */}
        <div className="space-y-4 md:col-span-1">
          <div className="bg-surface-secondary border border-border rounded p-3">
            <span className="block text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Workspace Avg Score
            </span>
            <span className="text-xl font-bold text-text-primary mt-1">
              {avgWorkspaceScore > 0 ? `${avgWorkspaceScore} / 5` : '—'}
            </span>
          </div>

          <div className="bg-surface-secondary border border-border rounded p-3">
            <span className="block text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Avg Turnaround Time
            </span>
            <span className="text-lg font-bold text-text-primary mt-1">
              {avgTurnaround > 0 ? `${avgTurnaround} Days` : '—'}
            </span>
            <span className="block text-[9px] text-text-muted mt-0.5">Submission &rarr; Review published</span>
          </div>
        </div>

        {/* Ratings details */}
        <div className="space-y-3 bg-surface-secondary border border-border rounded p-3 md:col-span-1">
          <h4 className="font-semibold text-text-primary border-b border-border/50 pb-1">Evaluations Summary</h4>
          <div className="space-y-2 leading-relaxed">
            <div>
              <span className="block text-[10px] text-text-muted font-semibold">Total Reviews Published</span>
              <span className="text-text-primary font-bold">{publishedCount}</span>
            </div>
            <div>
              <span className="block text-[10px] text-text-muted font-semibold">Revision Requests</span>
              <span className="text-text-primary font-bold text-orange-600">{revisionRequests}</span>
            </div>
            {highestContributor && (
              <div>
                <span className="block text-[10px] text-text-muted font-semibold">Highest Average Rating</span>
                <span className="text-text-primary font-medium text-green-600">
                  {highestContributor.name} ({highestContributor.avg} / 5)
                </span>
              </div>
            )}
            {lowestContributor && (
              <div>
                <span className="block text-[10px] text-text-muted font-semibold">Lowest Average Rating</span>
                <span className="text-text-primary font-medium text-red-500">
                  {lowestContributor.name} ({lowestContributor.avg} / 5)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Review distribution bar charts */}
        <div className="space-y-3 md:col-span-1">
          <h4 className="font-semibold text-text-primary border-b border-border/50 pb-1">Score Distribution</h4>
          <div className="space-y-2.5">
            {distribution.map((d, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-text-secondary font-medium">{d.label}</span>
                  <span className="text-text-muted">{d.count}</span>
                </div>
                <div className="w-full bg-surface-secondary rounded-full h-1 overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Component 7: ActivityInsights ─────────────────────────────────────────────

interface ActivityInsightsProps {
  activities: Activity[];
  contributors: Contributor[];
}

export function ActivityInsights({ activities, contributors }: ActivityInsightsProps) {
  const now = new Date();

  // Activity filters for periods
  const countLastH = (hours: number) => {
    const cutoff = now.getTime() - hours * 60 * 60 * 1000;
    return activities.filter((a) => new Date(a.timestamp).getTime() >= cutoff).length;
  };

  const count24h = countLastH(24);
  const count7d = countLastH(24 * 7);
  const count30d = countLastH(24 * 30);

  // Most active type
  const typeCounts: Record<string, number> = {};
  activities.forEach((a) => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });

  let mostCommonType = '—';
  let maxTypeCount = 0;
  Object.entries(typeCounts).forEach(([type, count]) => {
    if (count > maxTypeCount) {
      maxTypeCount = count;
      mostCommonType = type;
    }
  });

  // Most active contributor
  const contributorCounts: Record<string, number> = {};
  activities.forEach((a) => {
    const actorId = a.performedBy || a.contributorId;
    if (actorId) {
      contributorCounts[actorId] = (contributorCounts[actorId] || 0) + 1;
    }
  });

  let mostActiveContributorName = '—';
  let maxContrCount = 0;
  Object.entries(contributorCounts).forEach(([cId, count]) => {
    if (count > maxContrCount) {
      const found = contributors.find((c) => c.id === cId);
      if (found) {
        maxContrCount = count;
        mostActiveContributorName = found.name;
      }
    }
  });

  // 3-Day Recent Activity Trend Horizontal Bar values
  const countDayOffset = (offset: number) => {
    const start = new Date();
    start.setDate(start.getDate() - offset);
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setDate(end.getDate() - offset);
    end.setHours(23, 59, 59, 999);

    return activities.filter((a) => {
      const time = new Date(a.timestamp).getTime();
      return time >= start.getTime() && time <= end.getTime();
    }).length;
  };

  const todayCount = countDayOffset(0);
  const yesterdayCount = countDayOffset(1);
  const twoDaysAgoCount = countDayOffset(2);

  const maxDaily = Math.max(todayCount, yesterdayCount, twoDaysAgoCount, 1);

  return (
    <div className="card bg-surface space-y-6">
      <div className="border-b border-border pb-3">
        <h3 className="text-sm font-semibold text-text-primary">Activity Insights</h3>
        <p className="text-[11px] text-text-muted mt-0.5">Workspace event stream indicators.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Event frequency counts */}
        <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:col-span-1">
          <div className="bg-surface-secondary border border-border rounded p-2.5">
            <span className="block text-[10px] text-text-muted uppercase font-bold">Last 24 Hours</span>
            <span className="text-base font-bold text-text-primary mt-1">{count24h} Events</span>
          </div>
          <div className="bg-surface-secondary border border-border rounded p-2.5">
            <span className="block text-[10px] text-text-muted uppercase font-bold">Last 7 Days</span>
            <span className="text-base font-bold text-text-primary mt-1">{count7d} Events</span>
          </div>
          <div className="bg-surface-secondary border border-border rounded p-2.5">
            <span className="block text-[10px] text-text-muted uppercase font-bold">Last 30 Days</span>
            <span className="text-base font-bold text-text-primary mt-1">{count30d} Events</span>
          </div>
        </div>

        {/* Most common items summaries */}
        <div className="space-y-3 bg-surface-secondary border border-border rounded p-3 md:col-span-1">
          <h4 className="font-semibold text-text-primary border-b border-border/50 pb-1">Activity Highlights</h4>
          <div className="space-y-2 leading-relaxed">
            <div>
              <span className="block text-[10px] text-text-muted font-semibold">Most Common Activity Type</span>
              <span className="text-text-primary font-bold text-xs">{mostCommonType}</span>
              {maxTypeCount > 0 && <span className="block text-[10px] text-text-muted">{maxTypeCount} events</span>}
            </div>
            <div>
              <span className="block text-[10px] text-text-muted font-semibold">Most Active Member</span>
              <span className="text-text-primary font-bold text-xs">{mostActiveContributorName}</span>
              {maxContrCount > 0 && <span className="block text-[10px] text-text-muted">{maxContrCount} interactions</span>}
            </div>
          </div>
        </div>

        {/* 3-day recent trend visual horizontal bars */}
        <div className="space-y-3 md:col-span-1">
          <h4 className="font-semibold text-text-primary border-b border-border/50 pb-1">Recent 3-Day Trend</h4>
          <div className="space-y-2.5 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-text-secondary font-medium">Today</span>
                <span className="font-bold text-text-primary">{todayCount}</span>
              </div>
              <div className="w-full bg-surface-secondary rounded h-2.5 overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${(todayCount / maxDaily) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-text-secondary font-medium">Yesterday</span>
                <span className="font-bold text-text-primary">{yesterdayCount}</span>
              </div>
              <div className="w-full bg-surface-secondary rounded h-2.5 overflow-hidden">
                <div
                  className="h-full bg-accent/70 transition-all duration-300"
                  style={{ width: `${(yesterdayCount / maxDaily) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-text-secondary font-medium">2 Days Ago</span>
                <span className="font-bold text-text-primary">{twoDaysAgoCount}</span>
              </div>
              <div className="w-full bg-surface-secondary rounded h-2.5 overflow-hidden">
                <div
                  className="h-full bg-accent/40 transition-all duration-300"
                  style={{ width: `${(twoDaysAgoCount / maxDaily) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
