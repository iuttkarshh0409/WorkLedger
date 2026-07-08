/**
 * Shared Domain Types
 *
 * Primitive types and utility constructs used across all domain modules.
 *
 * Rules:
 * - No framework imports (no React, no Vite, no browser APIs).
 * - No business logic.
 * - No persistence concerns.
 * - Types here describe shape only.
 */

import { REVIEW_SCORE_MIN, REVIEW_SCORE_MAX } from './enums';

// ─── Primitives ───────────────────────────────────────────────────────────────

/**
 * EntityId
 *
 * Opaque string identifier for all domain entities.
 * Format is implementation-defined (UUID v4 recommended).
 * Services are responsible for generating valid IDs.
 */
export type EntityId = string;

/**
 * Timestamp
 *
 * ISO 8601 date-time string (e.g. "2026-07-08T10:30:00.000Z").
 * All timestamps are stored as strings to remain storage-agnostic.
 * Conversion to Date objects is the responsibility of services,
 * never of entity definitions.
 */
export type Timestamp = string;

// ─── DTO Rule ─────────────────────────────────────────────────────────────────

/**
 * Create and Update input types (DTOs) must always be defined independently
 * of their corresponding entity interfaces.
 *
 * Do NOT use:
 *   type CreateXInput = Partial<X>
 *   type CreateXInput = Omit<X, 'id' | 'createdAt'>
 *   interface CreateXInput extends X { ... }
 *
 * Always declare them as standalone interfaces in their module's types.ts.
 *
 * Reason: entities carry readonly fields, system-assigned fields, and domain
 * invariants that have no meaning at creation time. Keeping DTOs separate
 * makes future API contracts, validation, and versioning straightforward.
 */

// ─── Score ────────────────────────────────────────────────────────────────────

/**
 * ReviewScore
 *
 * A numeric value in the range [0, 10] representing a single
 * review category score.
 *
 * 0     = Not Evaluated
 * 1–2   = Poor
 * 3–4   = Needs Improvement
 * 5–6   = Satisfactory
 * 7–8   = Good
 * 9–10  = Exceptional
 *
 * @see 05_scoring_engine.md (Score Scale)
 */
export type ReviewScore = number;

/** Compile-time bounds — used by validators, not enforced by the type itself. */
export const REVIEW_SCORE_BOUNDS = {
  min: REVIEW_SCORE_MIN,
  max: REVIEW_SCORE_MAX,
} as const;

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * ValidationResult
 *
 * Returned by every validation function.
 * A result is either valid (no errors) or invalid (one or more error messages).
 *
 * Validators never throw — they always return a result.
 *
 * TODO: Future improvement — make generic:
 *
 *   type ValidationResult<T> = { valid: true; value: T } | { valid: false; errors: string[] }
 *
 * This would allow validators to return the validated (and narrowed) value
 * on success, making parsing and validation a single operation.
 */
export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

/**
 * invalid
 *
 * Convenience constructor for a failed ValidationResult.
 */
export function invalid(errors: string[]): ValidationResult {
  return { valid: false, errors };
}

/**
 * valid
 *
 * Convenience constructor for a successful ValidationResult.
 */
export function valid(): ValidationResult {
  return { valid: true };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * isNonEmptyString
 *
 * Returns true when the value is a string with at least one non-whitespace
 * character. Used throughout validators.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * isValidTimestamp
 *
 * Returns true when the value is a non-empty string that parses as a
 * valid date. Does not enforce ISO 8601 format strictly — services are
 * responsible for formatting before persisting.
 */
export function isValidTimestamp(value: unknown): value is Timestamp {
  if (!isNonEmptyString(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

/**
 * isValidReviewScore
 *
 * Returns true when the value is an integer in [0, 10].
 */
export function isValidReviewScore(value: unknown): value is ReviewScore {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= REVIEW_SCORE_BOUNDS.min &&
    value <= REVIEW_SCORE_BOUNDS.max
  );
}
