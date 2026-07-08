/**
 * QuickActions
 *
 * Shortcuts to the two most common workspace operations:
 *   - Add Contributor  (opens ContributorFormDialog)
 *   - Create Assignment (opens AssignmentFormDialog)
 *
 * Both dialogs are the same implementations used on their respective pages.
 * No duplicate logic is introduced here.
 *
 * @see docs/06_ui_architecture.md (Dashboard — quick actions)
 */

import { useState } from 'react';
import { clsx } from 'clsx';
import type { Contributor } from '@domain';
import { ContributorFormDialog } from '@features/contributors/ContributorFormDialog';
import { AssignmentFormDialog }  from '@features/assignments/AssignmentFormDialog';
import type { ContributorFormValues } from '@features/contributors/ContributorFormDialog';
import type { AssignmentFormValues }  from '@features/assignments/AssignmentFormDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickActionsProps {
  contributors:       Contributor[];
  submittingContrib:  boolean;
  submitContribError: string | null;
  submittingAssign:   boolean;
  submitAssignError:  string | null;
  onAddContributor:   (values: ContributorFormValues) => Promise<boolean>;
  onCreateAssignment: (values: AssignmentFormValues)  => Promise<boolean>;
  clearContribError:  () => void;
  clearAssignError:   () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuickActions({
  contributors,
  submittingContrib,
  submitContribError,
  submittingAssign,
  submitAssignError,
  onAddContributor,
  onCreateAssignment,
  clearContribError,
  clearAssignError,
}: QuickActionsProps) {
  const [contribOpen, setContribOpen] = useState(false);
  const [assignOpen,  setAssignOpen]  = useState(false);

  const btnClass = clsx(
    'flex items-center gap-2 px-4 py-2.5 rounded-md w-full',
    'text-sm font-medium text-left',
    'border border-border hover:bg-surface-muted hover:border-border-strong',
    'transition-colors duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  );

  return (
    <>
      <div className="card flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Quick actions</h2>

        <button
          type="button"
          onClick={() => { clearContribError(); setContribOpen(true); }}
          className={btnClass}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true" className="text-accent shrink-0">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1" />
          </svg>
          <span>Add contributor</span>
        </button>

        <button
          type="button"
          onClick={() => { clearAssignError(); setAssignOpen(true); }}
          className={btnClass}
          disabled={contributors.length === 0}
          aria-describedby={contributors.length === 0 ? 'qa-assign-hint' : undefined}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true" className="text-accent shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span className={contributors.length === 0 ? 'text-text-muted' : ''}>
            Create assignment
          </span>
        </button>

        {contributors.length === 0 && (
          <p id="qa-assign-hint" className="text-xs text-text-muted">
            Add at least one contributor before creating an assignment.
          </p>
        )}
      </div>

      {/* Contributor dialog */}
      <ContributorFormDialog
        open={contribOpen}
        submitLabel="Add contributor"
        submitting={submittingContrib}
        error={submitContribError}
        onSubmit={async (values) => {
          const ok = await onAddContributor(values);
          if (ok) setContribOpen(false);
        }}
        onClose={() => { if (!submittingContrib) { clearContribError(); setContribOpen(false); } }}
      />

      {/* Assignment dialog */}
      <AssignmentFormDialog
        open={assignOpen}
        submitLabel="Create assignment"
        submitting={submittingAssign}
        error={submitAssignError}
        contributors={contributors}
        onSubmit={async (values) => {
          const ok = await onCreateAssignment(values);
          if (ok) setAssignOpen(false);
        }}
        onClose={() => { if (!submittingAssign) { clearAssignError(); setAssignOpen(false); } }}
      />
    </>
  );
}
