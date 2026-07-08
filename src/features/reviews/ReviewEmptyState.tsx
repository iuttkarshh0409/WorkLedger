/**
 * ReviewEmptyState
 *
 * Displayed when an Assignment has no reviews yet.
 * Teaches what a Review is and what statuses enable reviewing.
 *
 * @see docs/07_design_system.md (Empty states educate)
 * @see docs/04_assignment_lifecycle.md (Submitted → Under Review → Completed)
 */

interface ReviewEmptyStateProps {
  canReview: boolean;
  onReview:  () => void;
}

export function ReviewEmptyState({ canReview, onReview }: ReviewEmptyStateProps) {
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
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h8M8 14h5" />
        </svg>
      </div>

      <h4 className="text-sm font-semibold text-text-primary mb-1">
        No reviews yet
      </h4>
      <p className="text-xs text-text-secondary max-w-xs mb-4 leading-relaxed">
        Reviews evaluate Submissions across six dimensions: Technical Quality, Documentation,
        Communication, Ownership, Problem Solving, and Timeliness. Each published Review
        becomes a permanent record in the Contributor's Ledger.
      </p>

      {canReview ? (
        <button
          type="button"
          onClick={onReview}
          className="
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
            text-xs font-medium text-text-inverse bg-accent
            hover:bg-accent-hover transition-colors duration-150
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
          "
        >
          Write review
        </button>
      ) : (
        <p className="text-xs text-text-muted">
          A Submission must be present before a Review can be written.
        </p>
      )}
    </div>
  );
}
