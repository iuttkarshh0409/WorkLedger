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
