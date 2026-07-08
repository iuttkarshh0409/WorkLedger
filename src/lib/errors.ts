/**
 * Error Utilities
 *
 * Shared helpers for working with AnyDomainError throughout the
 * Application Layer.
 *
 * These helpers exist to:
 * - Centralise the `isDomainError()` narrowing guard (ADR-001)
 * - Provide consistent factory functions for constructing domain errors
 * - Keep service methods readable by hiding boilerplate narrowing
 *
 * @see docs/adr/ADR-001-repository-result-strategy.md
 * @see src/domain/shared/errors.ts (AnyDomainError definition)
 */

import type {
  AnyDomainError,
  ValidationError,
  NotFoundError,
  ConflictError,
  PermissionError,
  DomainError,
} from '@domain';

// ─── Narrowing ────────────────────────────────────────────────────────────────

/**
 * isDomainError
 *
 * Returns true when the value is an AnyDomainError.
 *
 * Use this guard to distinguish error results from success values in
 * repository and service return types.
 *
 * Usage:
 *   const result = await repo.findById(id);
 *   if (isDomainError(result)) return result;
 *   // result is now narrowed to the success type
 *
 * Design note (ADR-001):
 *   This guard checks for the presence of a `kind` string field.
 *   No domain entity currently has a `kind` field. If one is introduced,
 *   a type error will surface immediately.
 */
export function isDomainError(value: unknown): value is AnyDomainError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    typeof (value as Record<string, unknown>)['kind'] === 'string'
  );
}

// ─── Assertion ────────────────────────────────────────────────────────────────

/**
 * assertSuccess
 *
 * Asserts that a value is not a DomainError.
 * Throws a plain Error (not a DomainError) if the assertion fails.
 *
 * Use only in test contexts or places where an error result is truly
 * unexpected. In production service code, prefer `isDomainError()`.
 *
 * @throws Error when value is an AnyDomainError
 */
export function assertSuccess<T>(value: T | AnyDomainError): T {
  if (isDomainError(value)) {
    throw new Error(
      `Unexpected domain error [${value.kind}]: ${
        'message' in value ? (value as DomainError).message : JSON.stringify(value)
      }`,
    );
  }
  return value as T;
}

// ─── Error factories ──────────────────────────────────────────────────────────

/**
 * validationError
 *
 * Constructs a ValidationError from a list of messages.
 */
export function validationError(
  context: string,
  errors: string[],
): ValidationError {
  return { kind: 'ValidationError', context, errors };
}

/**
 * notFound
 *
 * Constructs a NotFoundError for a named entity and id.
 */
export function notFound(entity: string, id: string): NotFoundError {
  return { kind: 'NotFoundError', entity, id };
}

/**
 * conflict
 *
 * Constructs a ConflictError with a human-readable message.
 */
export function conflict(message: string): ConflictError {
  return { kind: 'ConflictError', message };
}

/**
 * permissionDenied
 *
 * Constructs a PermissionError for a named action and reason.
 */
export function permissionDenied(action: string, reason: string): PermissionError {
  return { kind: 'PermissionError', action, reason };
}

/**
 * domainError
 *
 * Constructs a generic DomainError.
 * Prefer a more specific factory when one is available.
 */
export function domainError(message: string): DomainError {
  return { kind: 'DomainError', message };
}
