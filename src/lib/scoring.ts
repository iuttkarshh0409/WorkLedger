/**
 * Scoring Utilities
 *
 * Derives the overall Review score from individual category scores.
 *
 * Rule (05_scoring_engine.md):
 *   Overall score = average of all *evaluated* categories.
 *   A score of 0 means "Not Evaluated" and is excluded from the average.
 *   If all categories are 0 (none evaluated), the overall score is 0.
 *
 * The overall score is never stored on the Review entity.
 * It is calculated on demand — currently by ReviewService.publishReview().
 *
 * @see docs/05_scoring_engine.md (Score Calculation)
 */

import type { ReviewScores } from '@domain';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OverallScore {
  /** Arithmetic mean of all evaluated (non-zero) category scores. */
  readonly value: number;
  /** Number of categories that contributed to the average. */
  readonly evaluatedCount: number;
  /** Total number of scoring categories. */
  readonly totalCategories: number;
}

// ─── Calculation ──────────────────────────────────────────────────────────────

const SCORE_KEYS: ReadonlyArray<keyof ReviewScores> = [
  'technicalQuality',
  'documentation',
  'communication',
  'ownership',
  'problemSolving',
  'timeliness',
];

export interface PerformanceRating {
  label: string;
  colorClass: string;
  dotColorClass: string;
}

export function getPerformanceRating(score: number): PerformanceRating {
  if (score >= 9.0) {
    return {
      label: 'Outstanding',
      colorClass: 'bg-green-50 text-green-700 ring-green-600/20',
      dotColorClass: 'bg-green-600',
    };
  }
  if (score >= 8.0) {
    return {
      label: 'Excellent',
      colorClass: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
      dotColorClass: 'bg-emerald-600',
    };
  }
  if (score >= 7.0) {
    return {
      label: 'Good',
      colorClass: 'bg-blue-50 text-blue-700 ring-blue-600/20',
      dotColorClass: 'bg-blue-600',
    };
  }
  if (score >= 6.0) {
    return {
      label: 'Satisfactory',
      colorClass: 'bg-amber-50 text-amber-700 ring-amber-600/20',
      dotColorClass: 'bg-amber-500',
    };
  }
  return {
    label: 'Needs Improvement',
    colorClass: 'bg-red-50 text-red-700 ring-red-600/20',
    dotColorClass: 'bg-red-600',
  };
}

/**
 * calculateOverallScore
 *
 * Returns the derived overall score and supporting metadata.
 *
 * A score of 0 means "Not Evaluated" — excluded from the average.
 * All six categories scoring 0 yields { value: 0, evaluatedCount: 0 }.
 *
 * @see docs/05_scoring_engine.md (Score Scale — 0 = Not Evaluated)
 */
export function calculateOverallScore(scores: ReviewScores): OverallScore {
  const evaluated = SCORE_KEYS.map((k) => scores[k]).filter((s) => s > 0);

  const value =
    evaluated.length === 0
      ? 0
      : Math.round(
          (evaluated.reduce((sum, s) => sum + s, 0) / evaluated.length) * 10,
        ) / 10;

  return {
    value,
    evaluatedCount: evaluated.length,
    totalCategories: SCORE_KEYS.length,
  };
}
