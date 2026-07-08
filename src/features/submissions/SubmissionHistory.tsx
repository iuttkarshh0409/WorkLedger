/**
 * SubmissionHistory
 *
 * Renders the full chronological submission history for an Assignment.
 * Newest submission shown first. Revision numbers are computed from position.
 *
 * @see docs/04_assignment_lifecycle.md (Rule 7 — Revision history is permanent)
 */

import type { Submission } from '@domain';
import { SubmissionCard } from './SubmissionCard';

interface SubmissionHistoryProps {
  submissions: Submission[];
}

export function SubmissionHistory({ submissions }: SubmissionHistoryProps) {
  if (submissions.length === 0) return null;

  // submissions is newest-first; total count drives revision numbering
  const total = submissions.length;

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide">
        Submission history · {total} {total === 1 ? 'entry' : 'entries'}
      </h4>
      {submissions.map((submission, index) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          // newest-first display: index 0 = most recent = revisionNumber total
          revisionNumber={total - index}
          isLatest={index === 0}
        />
      ))}
    </div>
  );
}
