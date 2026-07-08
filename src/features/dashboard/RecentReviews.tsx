/**
 * RecentReviews
 *
 * The five most recent published reviews with derived overall scores.
 * Scores are calculated using calculateOverallScore() — never stored.
 *
 * @see docs/05_scoring_engine.md (Score Calculation)
 */

import { clsx } from 'clsx';
import type { ReviewSummaryItem } from './useDashboard';

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score === 0        ? 'text-text-muted'  :
    score < 4          ? 'text-danger'       :
    score < 6          ? 'text-warning'      :
    score < 8          ? 'text-amber-600'    :
    score < 9          ? 'text-green-600'    :
                         'text-green-700';

  return (
    <span className={clsx('text-sm font-bold tabular-nums shrink-0', cls)}>
      {score === 0 ? '—' : score.toFixed(1)}
      {score > 0 && <span className="text-xs font-normal text-text-muted">/10</span>}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RecentReviewsProps {
  reviews: ReviewSummaryItem[];
}

export function RecentReviews({ reviews }: RecentReviewsProps) {
  return (
    <div className="card flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-primary">Recent reviews</h2>

      {reviews.length === 0 ? (
        <p className="text-xs text-text-muted py-2">
          No published reviews yet. Reviews will appear here once assignments are completed.
        </p>
      ) : (
        <div>
          {reviews.map(({ review, assignment, contributor, overallScore }) => (
            <div
              key={review.id}
              className="flex items-center gap-3 py-2 border-b border-border last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-medium truncate">
                  {assignment?.title ?? 'Unknown assignment'}
                </p>
                <p className="text-xs text-text-muted">
                  {contributor?.name ?? 'Unknown contributor'} · {formatDate(review.reviewedOn)}
                </p>
              </div>
              <ScoreBadge score={overallScore} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
