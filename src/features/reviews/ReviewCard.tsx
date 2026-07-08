/**
 * ReviewCard
 *
 * Displays a single Review with scores, strengths, improvements, and feedback.
 * Stable layout — every field renders with a placeholder when unavailable.
 *
 * Revision-request reviews (all scores = 0) are displayed as feedback-only cards.
 *
 * @see docs/05_scoring_engine.md (Score Scale, Evaluation Categories)
 */

import { clsx } from 'clsx';
import type { Review, Contributor } from '@domain';
import { calculateOverallScore } from '@lib/scoring';

// ─── Score category labels ────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  technicalQuality: 'Technical',
  documentation:    'Docs',
  communication:    'Communication',
  ownership:        'Ownership',
  problemSolving:   'Problem Solving',
  timeliness:       'Timeliness',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function scoreColor(score: number): string {
  if (score === 0) return 'text-text-muted';
  if (score <= 2)  return 'text-danger';
  if (score <= 4)  return 'text-orange-600';
  if (score <= 6)  return 'text-amber-600';
  if (score <= 8)  return 'text-green-600';
  return 'text-green-700 font-semibold';
}

function scoreLabel(score: number): string {
  if (score === 0) return '—';
  if (score <= 2)  return 'Poor';
  if (score <= 4)  return 'Needs improvement';
  if (score <= 6)  return 'Satisfactory';
  if (score <= 8)  return 'Good';
  return 'Exceptional';
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewCardProps {
  review:       Review;
  reviewer:     Contributor | undefined;
  isRevisionRequest?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReviewCard({ review, reviewer, isRevisionRequest = false }: ReviewCardProps) {
  const overall    = calculateOverallScore(review.scores);
  const hasScores  = overall.evaluatedCount > 0;

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-text-primary">
            {isRevisionRequest ? 'Revision requested' : 'Review published'}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            by {reviewer?.name ?? 'Unknown reviewer'} · {formatDate(review.reviewedOn)}
          </p>
        </div>

        {hasScores && !isRevisionRequest && (
          <div className="text-right shrink-0">
            <p className="text-lg font-semibold text-text-primary leading-none">
              {overall.value.toFixed(1)}
            </p>
            <p className="text-xs text-text-muted mt-0.5">
              / 10 overall
            </p>
          </div>
        )}
      </div>

      {/* Scores grid */}
      {hasScores && !isRevisionRequest && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.entries(CATEGORY_LABELS) as [keyof typeof CATEGORY_LABELS, string][]).map(([key, label]) => {
            const score = review.scores[key as keyof typeof review.scores];
            return (
              <div key={key} className="flex flex-col gap-0.5">
                <span className="text-xs text-text-muted">{label}</span>
                <span className={clsx('text-sm font-medium', scoreColor(score))}>
                  {score === 0 ? '—' : score} {score > 0 && <span className="text-xs font-normal text-text-muted">({scoreLabel(score)})</span>}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Strengths */}
      {review.strengths.length > 0 && (
        <div>
          <p className="text-xs font-medium text-green-700 mb-1">What went well</p>
          <ul className="space-y-0.5">
            {review.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <span className="text-green-600 mt-0.5 shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {review.improvements.length > 0 && (
        <div>
          <p className="text-xs font-medium text-orange-700 mb-1">Opportunities for improvement</p>
          <ul className="space-y-0.5">
            {review.improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-text-secondary">
                <span className="text-orange-500 mt-0.5 shrink-0">→</span>
                {imp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Feedback */}
      {review.feedback && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs font-medium text-text-muted mb-1">
            {isRevisionRequest ? 'Revision notes' : 'Feedback'}
          </p>
          <p className="text-xs text-text-secondary leading-relaxed">{review.feedback}</p>
        </div>
      )}
    </div>
  );
}
