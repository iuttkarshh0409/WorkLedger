/**
 * ReviewHistory
 *
 * Renders all reviews for an assignment in chronological order.
 * Distinguishes revision-request records (all-zero scores) from full reviews.
 *
 * @see docs/04_assignment_lifecycle.md (Rule 7 — history is permanent)
 */

import type { Review, Contributor } from '@domain';
import { ReviewCard } from './ReviewCard';

interface ReviewHistoryProps {
  reviews:      Review[];
  contributors: Contributor[];
}

function isRevisionRequest(review: Review): boolean {
  const scores = review.scores;
  return (
    scores.technicalQuality === 0 &&
    scores.documentation    === 0 &&
    scores.communication    === 0 &&
    scores.ownership        === 0 &&
    scores.problemSolving   === 0 &&
    scores.timeliness       === 0
  );
}

export function ReviewHistory({ reviews, contributors }: ReviewHistoryProps) {
  if (reviews.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide">
        Review history · {reviews.length} {reviews.length === 1 ? 'entry' : 'entries'}
      </h4>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          reviewer={contributors.find((c) => c.id === review.reviewedBy)}
          isRevisionRequest={isRevisionRequest(review)}
        />
      ))}
    </div>
  );
}
