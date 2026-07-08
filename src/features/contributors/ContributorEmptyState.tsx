/**
 * ContributorEmptyState
 *
 * Displayed when no contributors exist in the workspace.
 * Teaches the user what Contributors are and why they add them.
 *
 * @see docs/07_design_system.md (Empty states educate, not just indicate)
 */

interface ContributorEmptyStateProps {
  onAdd: () => void;
}

export function ContributorEmptyState({ onAdd }: ContributorEmptyStateProps) {
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
          <circle cx="9" cy="7" r="4" />
          <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      </div>

      {/* Heading */}
      <h3 className="text-base font-semibold text-text-primary mb-2">
        No contributors yet
      </h3>

      {/* Description — teaches the product */}
      <p className="text-sm text-text-secondary max-w-sm mb-2 leading-relaxed">
        Contributors are the people who do work inside this Workspace — developers,
        designers, writers, or anyone who takes on Assignments.
      </p>
      <p className="text-sm text-text-secondary max-w-sm mb-8 leading-relaxed">
        Each Contributor builds a permanent record of their Assignments, Reviews,
        and performance over time.
      </p>

      {/* Action */}
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
        Add first contributor
      </button>
    </div>
  );
}
