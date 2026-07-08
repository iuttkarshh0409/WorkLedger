/**
 * MilestonesPage
 *
 * Connected container for the Milestones feature.
 *
 * Data flow:
 *   mount   → useMilestones → bootstrap → getMilestonesByWorkspace + getAssignmentsByWorkspace
 *   create  → MilestoneFormDialog → useMilestones.createMilestone
 *   complete→ MilestoneCard → useMilestones.completeMilestone
 *   archive → MilestoneCard → useMilestones.archiveMilestone
 */

import { useState } from 'react';
import { clsx } from 'clsx';
import { useServices }          from '@hooks/useServices';
import { useMilestones }        from '@features/milestones/useMilestones';
import { MilestoneList }        from '@features/milestones/MilestoneList';
import { MilestoneEmptyState }  from '@features/milestones/MilestoneEmptyState';
import { MilestoneFormDialog }  from '@features/milestones/MilestoneFormDialog';
import type { MilestoneFormValues } from '@features/milestones/MilestoneFormDialog';

export function MilestonesPage() {
  const {
    milestone:   milestoneService,
    assignment:  assignmentService,
    workspace:   workspaceService,
  } = useServices();

  const {
    milestones,
    progress,
    loading,
    error,
    submitting,
    submitError,
    createMilestone,
    completeMilestone,
    archiveMilestone,
    clearSubmitError,
  } = useMilestones(milestoneService, assignmentService, workspaceService);

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpen  = () => { clearSubmitError(); setDialogOpen(true); };
  const handleClose = () => { if (submitting) return; clearSubmitError(); setDialogOpen(false); };

  const handleSubmit = async (values: MilestoneFormValues) => {
    const success = await createMilestone({
      title:       values.title.trim(),
      description: values.description.trim(),
      startDate:   new Date(values.startDate).toISOString(),
      deadline:    new Date(values.deadline).toISOString(),
    });
    if (success) setDialogOpen(false);
  };

  const hasMilestones = milestones.length > 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="page-header">
          <h2 className="page-title">Milestones</h2>
          <p className="page-description">
            {hasMilestones
              ? `${milestones.length} milestone${milestones.length !== 1 ? 's' : ''} in this workspace`
              : 'Organise assignments into phases and track progress'}
          </p>
        </div>
        {hasMilestones && !loading && (
          <button type="button" onClick={handleOpen}
            className={clsx(
              'shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md',
              'text-sm font-medium text-text-inverse bg-accent',
              'hover:bg-accent-hover transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}>
            <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New milestone
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div role="status" aria-label="Loading milestones" className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="card flex flex-col gap-3 animate-pulse" aria-hidden="true">
              <div className="flex justify-between">
                <div className="h-3.5 w-40 rounded bg-surface-muted"/>
                <div className="h-5 w-20 rounded bg-surface-muted"/>
              </div>
              <div className="h-2 w-full rounded-full bg-surface-muted"/>
              <div className="h-2.5 w-32 rounded bg-surface-muted"/>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div role="alert" className="card border-red-200 bg-red-50 text-sm text-red-700">
          <p className="font-medium mb-1">Failed to load milestones</p>
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && !hasMilestones && (
        <MilestoneEmptyState onAdd={handleOpen} />
      )}

      {/* List */}
      {!loading && !error && hasMilestones && (
        <MilestoneList
          milestones={milestones}
          progress={progress}
          onComplete={completeMilestone}
          onArchive={archiveMilestone}
        />
      )}

      <MilestoneFormDialog
        open={dialogOpen}
        submitting={submitting}
        error={submitError}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    </div>
  );
}
