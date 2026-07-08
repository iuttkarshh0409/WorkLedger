/**
 * DashboardPage
 *
 * Connected container for the Dashboard feature.
 * Operational overview of the workspace — summarises existing data only.
 *
 * Responsibilities:
 * - Wire all service instances into useDashboard
 * - Coordinate Quick Action mutations (add contributor, create assignment)
 * - Refresh dashboard data after successful Quick Actions
 * - Delegate all rendering to feature components
 *
 * Data flow:
 *   mount         → useDashboard → parallel load from all services
 *   quick-action  → ContributorService / AssignmentService → reload dashboard
 *
 * No new business logic is introduced here. All derivations happen in useDashboard.
 */

import { useCallback, useState } from 'react';
import { useServices }         from '@hooks/useServices';
import { useDashboard }        from '@features/dashboard/useDashboard';
import { useSession }          from '@app/SessionContext';
import { SummaryCards }        from '@features/dashboard/SummaryCards';
import { HistoricalImportCard } from '@features/dashboard/HistoricalImportCard';
import { PendingAssignments }  from '@features/dashboard/PendingAssignments';
import { RecentActivity }      from '@features/dashboard/RecentActivity';
import { RecentReviews }       from '@features/dashboard/RecentReviews';
import { QuickActions }        from '@features/dashboard/QuickActions';
import { CurrentMilestones }   from '@features/dashboard/CurrentMilestones';
import type { ContributorFormValues } from '@features/contributors/ContributorFormDialog';
import type { AssignmentFormValues }  from '@features/assignments/AssignmentFormDialog';
import { isDomainError }   from '@lib/errors';
import { getOrCreateDemoWorkspace, DEMO_OWNER_ID } from '@lib/bootstrap';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="page-container animate-pulse" aria-hidden="true">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card flex flex-col gap-2">
            <div className="h-7 w-12 rounded bg-surface-muted" />
            <div className="h-2.5 w-24 rounded bg-surface-muted" />
          </div>
        ))}
      </div>
      {/* Body row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card h-48" />
        <div className="card h-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card h-40" />
        <div className="card h-40" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const {
    workspace:   workspaceService,
    assignment:  assignmentService,
    contributor: contributorService,
    activity:    activityService,
    review:      reviewService,
    milestone:   milestoneService,
  } = useServices();

  const { session } = useSession();
  const actorId = session ? session.contributorId : DEMO_OWNER_ID;

  // ── Dashboard data ──────────────────────────────────────────────────────────
  // Remounting the hook by changing a key causes a fresh load after mutations.
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const {
    loading,
    error,
    summary,
    pendingWork,
    recentActivity,
    recentReviews,
    contributors,
    milestones,
    milestoneProgress,
  } = useDashboard(
    workspaceService,
    assignmentService,
    contributorService,
    activityService,
    reviewService,
    milestoneService,
  );

  // ── Quick action state ─────────────────────────────────────────────────────
  const [submittingContrib,  setSubmittingContrib]  = useState(false);
  const [submitContribError, setSubmitContribError] = useState<string | null>(null);
  const [submittingAssign,   setSubmittingAssign]   = useState(false);
  const [submitAssignError,  setSubmitAssignError]  = useState<string | null>(null);

  const handleAddContributor = useCallback(
    async (values: ContributorFormValues): Promise<boolean> => {
      setSubmittingContrib(true);
      setSubmitContribError(null);

      try {
        const wsId = await getOrCreateDemoWorkspace(workspaceService);
        const result = await contributorService.addContributor(
          {
            workspaceId: wsId,
            name:        values.name.trim(),
            email:       values.email.trim(),
            role:        values.role,
          },
          actorId,
        );

        if (isDomainError(result)) {
          const msg =
            result.kind === 'ValidationError' ? result.errors.join(' ') :
            result.kind === 'ConflictError'   ? result.message :
            'Failed to add contributor.';
          setSubmitContribError(msg);
          return false;
        }

        refresh();
        return true;
      } finally {
        setSubmittingContrib(false);
      }
    },
    [contributorService, workspaceService, refresh, actorId],
  );

  const handleCreateAssignment = useCallback(
    async (values: AssignmentFormValues): Promise<boolean> => {
      setSubmittingAssign(true);
      setSubmitAssignError(null);

      try {
        const wsId = await getOrCreateDemoWorkspace(workspaceService);
        const isHist = !!(values as any).isHistorical;
        const receivedDate = (values as any).receivedOn ? new Date((values as any).receivedOn).toISOString() : new Date().toISOString();
        const statusValue = (values as any).initialStatus;

        const result = await assignmentService.createAssignment(
          {
            workspaceId:   wsId,
            contributorId: values.contributorId,
            reviewerId:    values.reviewerId || null,
            title:         values.title.trim(),
            description:   values.description.trim(),
            priority:      values.priority,
            assignedOn:    receivedDate,
            deadline:      new Date(values.deadline).toISOString(),
            ...(isHist ? {
              isHistorical: true,
              enteredOn: new Date().toISOString().split('T')[0],
              createdAt: receivedDate,
              status: statusValue as any,
            } : {})
          },
          actorId,
        );

        if (isDomainError(result)) {
          const msg =
            result.kind === 'ValidationError' ? result.errors.join(' ') :
            'Failed to create assignment.';
          setSubmitAssignError(msg);
          return false;
        }

        // Automatically transition from Draft to Assigned
        if (!isHist && result.status === 'Draft' && result.contributorId) {
          await assignmentService.assignContributor(
            result.id,
            result.contributorId,
            actorId,
          );
        }

        refresh();
        return true;
      } finally {
        setSubmittingAssign(false);
      }
    },
    [assignmentService, workspaceService, refresh, actorId],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="page-container">
        <div role="alert" className="card border-red-200 bg-red-50 text-sm text-red-700">
          <p className="font-medium mb-1">Dashboard failed to load</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div key={refreshKey} className="page-container">

      {/* Page header */}
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
        <p className="page-description">Workspace overview</p>
      </div>

      {/* Historical Data Entry Mode Summary */}
      <div className="mb-4">
        <HistoricalImportCard />
      </div>

      {/* Row 1 — Summary metrics */}
      <SummaryCards summary={summary} />

      {/* Row 2 — Pending work (2/3) + Quick actions (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <PendingAssignments pendingWork={pendingWork} />
        </div>
        <div>
          <QuickActions
            contributors={contributors}
            submittingContrib={submittingContrib}
            submitContribError={submitContribError}
            submittingAssign={submittingAssign}
            submitAssignError={submitAssignError}
            onAddContributor={handleAddContributor}
            onCreateAssignment={handleCreateAssignment}
            clearContribError={() => setSubmitContribError(null)}
            clearAssignError={() => setSubmitAssignError(null)}
          />
        </div>
      </div>

      {/* Row 3 — Recent activity + Recent reviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RecentActivity activities={recentActivity} />
        <RecentReviews  reviews={recentReviews} />
      </div>

      {/* Row 4 — Current milestones */}
      {milestones.length > 0 && (
        <CurrentMilestones
          milestones={milestones}
          progress={milestoneProgress}
        />
      )}

    </div>
  );
}
