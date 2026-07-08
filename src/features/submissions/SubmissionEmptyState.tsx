/**
 * SubmissionEmptyState
 *
 * Displayed when an Assignment has no submissions yet.
 * Teaches the user what a Submission is and what to do next.
 *
 * @see docs/07_design_system.md (Empty states educate, not just indicate)
 * @see docs/04_assignment_lifecycle.md (In Progress → Submitted)
 */

interface SubmissionEmptyStateProps {
  onSubmit: () => void;
  canSubmit: boolean;
}

export function SubmissionEmptyState({ onSubmit, canSubmit }: SubmissionEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent-subtle mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
          aria-hidden="true"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <h4 className="text-sm font-semibold text-text-primary mb-1">
        No submissions yet
      </h4>
      <p className="text-xs text-text-secondary max-w-xs mb-4 leading-relaxed">
        When work is ready for review, submit it here. Each submission is preserved
        as a permanent record — revisions create new entries rather than overwriting history.
      </p>

      {canSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          className="
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
            text-xs font-medium text-text-inverse bg-accent
            hover:bg-accent-hover transition-colors duration-150
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
          "
        >
          Submit work
        </button>
      )}
    </div>
  );
}
