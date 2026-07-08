/**
 * MilestoneEmptyState
 *
 * Shown when no milestones exist in the workspace.
 * Teaches what Milestones are and why to create them.
 */

interface MilestoneEmptyStateProps {
  onAdd: () => void;
}

export function MilestoneEmptyState({ onAdd }: MilestoneEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent-subtle mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"
          strokeLinejoin="round" className="text-accent" aria-hidden="true">
          <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/>
        </svg>
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-2">No milestones yet</h3>
      <p className="text-sm text-text-secondary max-w-sm mb-2 leading-relaxed">
        Milestones group related Assignments into meaningful phases of work —
        a sprint, a release, a project stage.
      </p>
      <p className="text-sm text-text-secondary max-w-sm mb-8 leading-relaxed">
        Progress is calculated automatically from the Assignments inside each Milestone.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="
          inline-flex items-center gap-2 px-4 py-2 rounded-md
          text-sm font-medium text-text-inverse bg-accent
          hover:bg-accent-hover transition-colors duration-150
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
        "
      >
        Create first milestone
      </button>
    </div>
  );
}
