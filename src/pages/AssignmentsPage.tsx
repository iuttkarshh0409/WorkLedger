/**
 * AssignmentsPage
 *
 * Connected container for the Assignments feature.
 *
 * Responsibilities:
 * - Wire service instances from context into useAssignments
 * - Manage create dialog state
 * - Manage which assignment's detail panel is expanded
 * - Coordinate assignment lifecycle transitions
 * - Delegate all submission and review rendering to AssignmentDetailPanel
 *
 * Data flow:
 *   mount    → useAssignments → bootstrap → getAssignmentsByWorkspace + getContributorsByWorkspace
 *   create   → AssignmentFormDialog → useAssignments.createAssignment → AssignmentService
 *   accept   → AssignmentCard → useAssignments.acceptAssignment → AssignmentService
 *   start    → AssignmentCard → useAssignments.startAssignment → AssignmentService
 *   archive  → AssignmentCard → useAssignments.archiveAssignment → AssignmentService
 *   submit   → AssignmentDetailPanel → useSubmissions → SubmissionService → onAssignmentUpdated
 *   review   → AssignmentDetailPanel → useReviews → ReviewService → onAssignmentUpdated
 */

import { useState, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { useSearchParams } from 'react-router-dom';
import { useServices } from '@hooks/useServices';
import { useRegisterShortcuts } from '@app/ShortcutContext';
import { useAssignments } from '@features/assignments/useAssignments';
import { AccordionCard }        from '@shared/components/AccordionCard';
import { AssignmentCard }        from '@features/assignments/AssignmentCard';
import { AssignmentDetailPanel } from '@features/assignments/AssignmentDetailPanel';
import { AssignmentEmptyState }  from '@features/assignments/AssignmentEmptyState';
import { AssignmentFilters }     from '@features/assignments/AssignmentFilters';
import { AssignmentFormDialog }  from '@features/assignments/AssignmentFormDialog';
import type { AssignmentFormValues } from '@features/assignments/AssignmentFormDialog';
import { DeleteAssignmentDialog } from '@features/assignments/DeleteAssignmentDialog';
import type { Assignment, AssignmentStatus, Milestone, EntityId } from '@domain';
import { isDomainError } from '@lib/errors';
import { getOrCreateDemoWorkspace } from '@lib/bootstrap';

export function AssignmentsPage() {
  const {
    assignment:  assignmentService,
    contributor: contributorService,
    workspace:   workspaceService,
    submission:  submissionService,
    review:      reviewService,
    activity:    activityService,
    milestone:   milestoneService,
  } = useServices();

  // Read optional ?status= param to support deep-linking from the Dashboard
  const [searchParams] = useSearchParams();
  const initialStatus = (searchParams.get('status') ?? '') as AssignmentStatus | '';

  const {
    filteredAssignments,
    assignments,
    contributors,
    filters,
    loading,
    error,
    submitting,
    submitError,
    createAssignment,
    acceptAssignment,
    startAssignment,
    archiveAssignment,
    editAssignment,
    deleteAssignment,
    updateAssignment,
    setFilters,
    clearSubmitError,
  } = useAssignments(assignmentService, contributorService, workspaceService, initialStatus);

  // ── Milestones for form dropdown ──────────────────────────────────────────
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const wsId = await getOrCreateDemoWorkspace(workspaceService);
        if (cancelled) return;
        const result = await milestoneService.getMilestonesByWorkspace(wsId);
        if (!cancelled && !isDomainError(result)) setMilestones(result);
      } catch { /* silently ignore — milestones are optional in the form */ }
    })();
    return () => { cancelled = true; };
  }, [milestoneService, workspaceService]);

  // ── Create dialog ──────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // ── Delete confirmation state ──────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);

  const handleOpenCreate = () => {
    setFormMode('create');
    setSelectedAssignment(null);
    clearSubmitError();
    setCreateOpen(true);
  };

  const handleOpenEdit = (assignment: Assignment) => {
    setFormMode('edit');
    setSelectedAssignment(assignment);
    clearSubmitError();
    setCreateOpen(true);
  };

  const handleOpenDuplicate = (assignment: Assignment) => {
    setFormMode('duplicate');
    setSelectedAssignment(assignment);
    clearSubmitError();
    setCreateOpen(true);
  };

  const handleOpenDelete = (assignment: Assignment) => {
    setDeleteTarget(assignment);
  };

  // Keyboard shortcut — must be declared after handleOpenCreate
  useRegisterShortcuts({ onNewAssignment: handleOpenCreate });

  const handleCloseCreate = () => {
    if (submitting) return;
    clearSubmitError();
    setCreateOpen(false);
    setSelectedAssignment(null);
  };
  const handleCreateSubmit = async (values: AssignmentFormValues) => {
    if (formMode === 'edit' && selectedAssignment) {
      const success = await editAssignment(selectedAssignment.id, {
        title:         values.title.trim(),
        description:   values.description.trim(),
        contributorId: values.contributorId,
        reviewerId:    values.reviewerId || null,
        milestoneId:   values.milestoneId || null,
        priority:      values.priority,
        deadline:      new Date(values.deadline).toISOString(),
      });
      if (success) {
        setCreateOpen(false);
        setSelectedAssignment(null);
      }
    } else {
      const success = await createAssignment({
        title:         values.title.trim(),
        description:   values.description.trim(),
        contributorId: values.contributorId,
        reviewerId:    values.reviewerId || null,
        milestoneId:   values.milestoneId || null,
        priority:      values.priority,
        deadline:      new Date(values.deadline).toISOString(),
      });
      if (success) {
        setCreateOpen(false);
        setSelectedAssignment(null);
      }
    }
  };

  // ── Detail panel selection ─────────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState<EntityId | null>(null);

  const handleTogglePanel = useCallback((id: EntityId) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Called by AssignmentDetailPanel when a submission/review transitions the assignment
  const handleAssignmentUpdated = useCallback(
    (updated: Assignment) => { updateAssignment(updated); },
    [updateAssignment],
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  const hasAssignments = assignments.length > 0;

  return (
    <div className="page-container">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="page-header">
          <h2 className="page-title">Assignments</h2>
          <p className="page-description">
            {hasAssignments
              ? `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''} in this workspace`
              : 'Delegate and track work through its complete lifecycle'}
          </p>
        </div>

        {hasAssignments && !loading && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className={clsx(
              'shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md',
              'text-sm font-medium text-text-inverse bg-accent',
              'hover:bg-accent-hover transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New assignment
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div role="status" aria-label="Loading assignments" className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card flex flex-col gap-3 animate-pulse" aria-hidden="true">
              <div className="flex justify-between">
                <div className="h-3.5 w-48 rounded bg-surface-muted" />
                <div className="h-5 w-20 rounded bg-surface-muted" />
              </div>
              <div className="h-2.5 w-full rounded bg-surface-muted" />
              <div className="flex gap-4">
                <div className="h-2.5 w-16 rounded bg-surface-muted" />
                <div className="h-2.5 w-24 rounded bg-surface-muted" />
                <div className="h-2.5 w-28 rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load error */}
      {!loading && error && (
        <div role="alert" className="card border-red-200 bg-red-50 text-sm text-red-700">
          <p className="font-medium mb-1">Failed to load assignments</p>
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Lifecycle action error */}
      {!loading && !error && submitError && (
        <div role="alert" className="card border-red-200 bg-red-50 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !hasAssignments && (
        <AssignmentEmptyState onAdd={handleOpenCreate} />
      )}

      {/* Filters + list */}
      {!loading && !error && hasAssignments && (
        <>
          <AssignmentFilters
            filters={filters}
            contributors={contributors}
            totalCount={assignments.length}
            shownCount={filteredAssignments.length}
            onChange={setFilters}
          />

          {filteredAssignments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-text-muted">No assignments match the current filters.</p>
              <p className="text-xs text-text-muted mt-1">Try adjusting the search or filter criteria.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredAssignments.map((assignment) => {
                const isExpanded = expandedId === assignment.id;
                return (
                  <AccordionCard
                    key={assignment.id}
                    open={isExpanded}
                    onToggle={() => handleTogglePanel(assignment.id)}
                    header={
                      <AssignmentCard
                        assignment={assignment}
                        contributors={contributors}
                        onAccept={(id) => { acceptAssignment(id); }}
                        onStart={(id)  => { startAssignment(id); }}
                        onArchive={(id) => { archiveAssignment(id); }}
                        onSubmit={(id)  => { setExpandedId(id); }}
                        onEdit={handleOpenEdit}
                        onDuplicate={handleOpenDuplicate}
                        onDelete={handleOpenDelete}
                      />
                    }
                  >
                    <AssignmentDetailPanel
                      assignment={assignment}
                      contributors={contributors}
                      submissionService={submissionService}
                      reviewService={reviewService}
                      assignmentService={assignmentService}
                      activityService={activityService}
                      onAssignmentUpdated={handleAssignmentUpdated}
                    />
                  </AccordionCard>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create assignment dialog */}
      <AssignmentFormDialog
        open={createOpen}
        submitLabel={formMode === 'edit' ? 'Save Changes' : formMode === 'duplicate' ? 'Duplicate Assignment' : 'Create assignment'}
        initialValues={selectedAssignment ? {
          title: formMode === 'duplicate' ? `${selectedAssignment.title} (Copy)` : selectedAssignment.title,
          description: selectedAssignment.description,
          contributorId: selectedAssignment.contributorId,
          reviewerId: selectedAssignment.reviewerId || '',
          milestoneId: selectedAssignment.milestoneId || '',
          priority: selectedAssignment.priority,
          deadline: selectedAssignment.deadline ? selectedAssignment.deadline.split('T')[0] : '',
        } : undefined}
        submitting={submitting}
        error={submitError}
        contributors={contributors}
        milestones={milestones}
        onSubmit={handleCreateSubmit}
        onClose={handleCloseCreate}
      />

      {/* Delete assignment confirmation dialog */}
      {deleteTarget && (
        <DeleteAssignmentDialog
          open={!!deleteTarget}
          assignmentTitle={deleteTarget.title}
          onConfirm={async () => {
            const success = await deleteAssignment(deleteTarget.id);
            if (success) {
              setDeleteTarget(null);
            }
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
