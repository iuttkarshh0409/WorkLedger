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
import { calculateOverallScore, getPerformanceRating } from '@lib/scoring';

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
  if (score < 6)  return 'text-danger';
  if (score < 7)  return 'text-orange-600';
  if (score < 8)  return 'text-amber-600';
  if (score < 9)  return 'text-green-600';
  return 'text-green-700 font-semibold';
}

function scoreLabel(score: number): string {
  if (score === 0) return '—';
  return getPerformanceRating(score).label;
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
          <div className="text-right shrink-0 text-xs text-text-secondary bg-surface-muted/30 p-3 rounded-lg border border-border flex flex-col gap-1.5 items-end justify-center">
            <div className="flex flex-col items-end gap-1">
              <div>
                <span className="font-semibold text-text-muted">Performance</span>{' '}
                <span className="font-bold text-text-primary text-sm">{overall.value.toFixed(1)}</span>{' '}
                <span className="text-text-muted">/ 10</span>
              </div>
              <span className={clsx("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset", getPerformanceRating(overall.value).colorClass)}>
                <span className={clsx("h-1.5 w-1.5 rounded-full", getPerformanceRating(overall.value).dotColorClass)} />
                <span>{getPerformanceRating(overall.value).label}</span>
              </span>
            </div>
            <div className="divider w-full my-0.5" />
            <div>
              <span className="font-semibold text-text-muted">Total</span>{' '}
              <span className="font-bold text-text-primary">{Object.values(review.scores).reduce((a, b) => a + b, 0)}</span>{' '}
              <span className="text-text-muted">/ 60</span>
            </div>
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
