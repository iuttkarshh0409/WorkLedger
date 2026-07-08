/**
 * Domain Error Types
 *
 * Defines the shared error vocabulary for the entire WorkLedger domain.
 *
 * Rules:
 * - Types only. No Error subclasses, no throw statements, no behavior.
 * - Every layer (services, repositories, UI) speaks this same language.
 * - Errors are values — callers decide how to handle or surface them.
 *
 * Usage:
 *   Services return DomainError (or a union) instead of throwing.
 *   The presentation layer maps DomainError kinds to user-facing messages.
 *
 * TODO: Once services arrive, consider a Result<T, DomainError> type
 * that pairs cleanly with ValidationResult<T>.
 */

// ─── Error kinds ──────────────────────────────────────────────────────────────

/**
 * DomainErrorKind
 *
 * Discriminant used to narrow a DomainError to its specific type.
 */
export type DomainErrorKind =
  | 'ValidationError'
  | 'NotFoundError'
  | 'ConflictError'
  | 'PermissionError'
  | 'DomainError';

// ─── Individual error types ───────────────────────────────────────────────────

/**
 * ValidationError
 *
 * One or more structural or business-rule violations were detected.
 * Carries the list of human-readable error messages produced by validators.
 */
export interface ValidationError {
  readonly kind: 'ValidationError';
  /** The field or entity that failed validation, e.g. "Assignment.deadline". */
  readonly context: string;
  readonly errors: string[];
}

/**
 * NotFoundError
 *
 * A requested entity does not exist in the data store.
 */
export interface NotFoundError {
  readonly kind: 'NotFoundError';
  /** The entity type that was not found, e.g. "Assignment". */
  readonly entity: string;
  /** The identifier that was looked up. */
  readonly id: string;
}

/**
 * ConflictError
 *
 * An operation cannot proceed because it conflicts with existing data.
 *
 * Examples:
 * - Duplicate email on Contributor creation.
 * - Attempting to publish a Review that already exists for a Submission.
 */
export interface ConflictError {
  readonly kind: 'ConflictError';
  /** Human-readable description of the conflict. */
  readonly message: string;
}

/**
 * PermissionError
 *
 * The performing user does not have the required role or ownership
 * to execute the requested operation.
 *
 * @see docs/04.5_permission_model.md
 */
export interface PermissionError {
  readonly kind: 'PermissionError';
  /** The action that was denied, e.g. "PublishReview". */
  readonly action: string;
  /** Human-readable reason for the denial. */
  readonly reason: string;
}

/**
 * DomainError
 *
 * A catch-all for domain violations that do not fit a more specific type.
 * Should be used sparingly — prefer the specific types above.
 */
export interface DomainError {
  readonly kind: 'DomainError';
  readonly message: string;
}

// ─── Union ────────────────────────────────────────────────────────────────────

/**
 * AnyDomainError
 *
 * Discriminated union of all domain error types.
 * Services return this type (or a subset) rather than throwing.
 *
 * Narrow with:
 *   if (error.kind === 'NotFoundError') { ... }
 */
export type AnyDomainError =
  | ValidationError
  | NotFoundError
  | ConflictError
  | PermissionError
  | DomainError;
