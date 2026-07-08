/**
 * AssignmentEmptyState
 *
 * Displayed when no assignments exist in the workspace.
 * Teaches the user what Assignments are and why they create them.
 *
 * @see docs/07_design_system.md (Empty states educate, not just indicate)
 * @see docs/02_domain_model.md (Assignment)
 */

interface AssignmentEmptyStateProps {
  onAdd: () => void;
}

export function AssignmentEmptyState({ onAdd }: AssignmentEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      {/* Icon */}
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent-subtle mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h6M9 13h6M9 17h4" />
        </svg>
      </div>

      <h3 className="text-base font-semibold text-text-primary mb-2">
        No assignments yet
      </h3>

      <p className="text-sm text-text-secondary max-w-sm mb-2 leading-relaxed">
        Assignments are the core unit of delegated work in WorkLedger. Create one
        to delegate a task to a Contributor, track progress, and collect a structured
        Review when work is complete.
      </p>
      <p className="text-sm text-text-secondary max-w-sm mb-8 leading-relaxed">
        Every Assignment becomes a permanent record in the Workspace Ledger.
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
        Create first assignment
      </button>
    </div>
  );
}
