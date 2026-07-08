/**
 * AssignmentList
 *
 * Renders the filtered list of AssignmentCards.
 * Shows a "no results" message when filters produce an empty set
 * but assignments do exist (distinct from the true empty state).
 */

import type { Assignment, Contributor } from '@domain';

interface AssignmentListProps {
  assignments:  Assignment[];
  contributors: Contributor[];
  onAccept:     (id: string) => void;
  onStart:      (id: string) => void;
  onArchive:    (id: string) => void;
  onSubmit:     (id: string) => void;
}

import { AssignmentCard } from './AssignmentCard';

export function AssignmentList({
  assignments,
  contributors,
  onAccept,
  onStart,
  onArchive,
  onSubmit,
}: AssignmentListProps) {
  if (assignments.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-text-muted">
          No assignments match the current filters.
        </p>
        <p className="text-xs text-text-muted mt-1">
          Try adjusting the search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {assignments.map((assignment) => (
        <AssignmentCard
          key={assignment.id}
          assignment={assignment}
          contributors={contributors}
          onAccept={onAccept}
          onStart={onStart}
          onArchive={onArchive}
          onSubmit={onSubmit}
        />
      ))}
    </div>
  );
}
