/**
 * Review Entity
 *
 * A Review is the structured evaluation of a Submission.
 * Reviews are permanent historical records — once published they
 * are immutable except by administrative correction.
 *
 * The entity contains only factual source data (the raw scores and
 * written feedback). Overall score calculation is the responsibility
 * of the Review Engine / Analytics Engine, never stored here.
 *
 * @see 02_domain_model.md (Review)
 * @see 03_data_schema.md (Review Schema)
 * @see 05_scoring_engine.md (Evaluation Categories, Score Scale)
 */

import type { EntityId, Timestamp, ReviewScore } from '../shared/types';

// ─── Review Scores ────────────────────────────────────────────────────────────

/**
 * ReviewScores
 *
 * One score per evaluation category.
 * Each value is an integer in [0, 10] where 0 means "Not Evaluated".
 *
 * @see 05_scoring_engine.md (Evaluation Categories)
 */
export interface ReviewScores {
  technicalQuality: ReviewScore;
  documentation: ReviewScore;
  communication: ReviewScore;
  ownership: ReviewScore;
  problemSolving: ReviewScore;
  timeliness: ReviewScore;
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface Review {
  readonly id: EntityId;
  readonly createdAt: Timestamp;
  updatedAt: Timestamp;

  assignmentId: EntityId;
  submissionId: EntityId;
  reviewedBy: EntityId;
  reviewedOn: Timestamp;

  scores: ReviewScores;

  /**
   * strengths
   *
   * A list of specific positive observations from the Reviewer.
   * Freeform strings — not derived, not calculated.
   *
   * @see 05_scoring_engine.md (Review Feedback — What Went Well)
   */
  strengths: string[];

  /**
   * improvements
   *
   * A list of specific, actionable improvement suggestions.
   *
   * @see 05_scoring_engine.md (Review Feedback — Opportunities for Improvement)
   */
  improvements: string[];

  /**
   * feedback
   *
   * Overall written feedback from the Reviewer.
   * Combines positive observations with recommended next steps.
   *
   * @see 05_scoring_engine.md (Review Feedback)
   */
  feedback: string;
}
