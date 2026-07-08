/**
 * Review Validation
 *
 * Structural validation for Review entities, ReviewScores, and input types.
 *
 * Scope:
 * - Required field presence
 * - All six score categories are valid integers in [0, 10]
 * - Timestamp presence
 *
 * Out of scope (belongs to services):
 * - Assignment must be in Submitted / Under Review state
 * - Reviewer must be the assigned Reviewer
 * - Published Review immutability enforcement
 * - Scores must not all be zero (business rule)
 */

import {
  type ValidationResult,
  valid,
  invalid,
  isNonEmptyString,
  isValidTimestamp,
  isValidReviewScore,
} from '../shared/types';
import type { Review, ReviewScores } from './entity';
import type { CreateReviewInput } from './types';

// ─── Score categories ─────────────────────────────────────────────────────────

const SCORE_CATEGORIES: Array<keyof ReviewScores> = [
  'technicalQuality',
  'documentation',
  'communication',
  'ownership',
  'problemSolving',
  'timeliness',
];

/**
 * validateReviewScores
 *
 * Validates that every category score is an integer in [0, 10].
 */
export function validateReviewScores(scores: ReviewScores): ValidationResult {
  const errors: string[] = [];

  for (const category of SCORE_CATEGORIES) {
    if (!isValidReviewScore(scores[category])) {
      errors.push(
        `Review score '${category}' must be an integer between 0 and 10.`,
      );
    }
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

// ─── Review validation ────────────────────────────────────────────────────────

/**
 * validateReview
 *
 * Validates a fully-constructed Review entity.
 */
export function validateReview(review: Review): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(review.id)) {
    errors.push('Review id is required.');
  }
  if (!isNonEmptyString(review.assignmentId)) {
    errors.push('Review assignmentId is required.');
  }
  if (!isNonEmptyString(review.submissionId)) {
    errors.push('Review submissionId is required.');
  }
  if (!isNonEmptyString(review.reviewedBy)) {
    errors.push('Review reviewedBy is required.');
  }
  if (!isValidTimestamp(review.reviewedOn)) {
    errors.push('Review reviewedOn must be a valid timestamp.');
  }
  if (!isNonEmptyString(review.createdAt)) {
    errors.push('Review createdAt is required.');
  }
  if (!isNonEmptyString(review.updatedAt)) {
    errors.push('Review updatedAt is required.');
  }

  // Validate scores object
  if (
    review.scores === null ||
    typeof review.scores !== 'object'
  ) {
    errors.push('Review scores is required and must be an object.');
  } else {
    const scoresResult = validateReviewScores(review.scores);
    if (!scoresResult.valid) {
      errors.push(...scoresResult.errors);
    }
  }

  if (!Array.isArray(review.strengths)) {
    errors.push('Review strengths must be an array.');
  }
  if (!Array.isArray(review.improvements)) {
    errors.push('Review improvements must be an array.');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * validateCreateReviewInput
 *
 * Validates the input required to create a new Review.
 */
export function validateCreateReviewInput(
  input: CreateReviewInput,
): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.assignmentId)) {
    errors.push('Review assignmentId is required.');
  }
  if (!isNonEmptyString(input.submissionId)) {
    errors.push('Review submissionId is required.');
  }
  if (!isNonEmptyString(input.reviewedBy)) {
    errors.push('Review reviewedBy is required.');
  }
  if (!isValidTimestamp(input.reviewedOn)) {
    errors.push('Review reviewedOn must be a valid timestamp.');
  }

  if (input.scores === null || typeof input.scores !== 'object') {
    errors.push('Review scores is required and must be an object.');
  } else {
    const scoresResult = validateReviewScores(input.scores);
    if (!scoresResult.valid) {
      errors.push(...scoresResult.errors);
    }
  }

  return errors.length > 0 ? invalid(errors) : valid();
}
