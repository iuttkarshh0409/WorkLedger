/**
 * Storage Error Types
 *
 * Defines the error vocabulary for the storage infrastructure layer.
 *
 * These types are intentionally separate from the domain error types
 * in src/domain/shared/errors.ts. Infrastructure errors describe
 * persistence failures; domain errors describe business violations.
 *
 * Rules:
 * - Types only. No Error subclasses, no throw statements, no behavior.
 * - Repositories translate storage errors into domain errors where needed.
 * - The domain layer never imports from this file.
 *
 * @see docs/09_technical_architecture.md (Infrastructure Layer)
 * @see docs/10_development_guidelines.md (Error Handling)
 */

// ─── Error kinds ──────────────────────────────────────────────────────────────

export type StorageErrorKind =
  | 'StorageUnavailable'
  | 'SerializationError'
  | 'DeserializationError'
  | 'StorageWriteError'
  | 'StorageReadError';

// ─── Individual error types ───────────────────────────────────────────────────

/**
 * StorageUnavailableError
 *
 * The underlying storage mechanism (e.g. localStorage) is not accessible.
 *
 * Common causes:
 * - Private browsing mode with storage blocked
 * - Storage quota exceeded
 * - Browser security policy
 */
export interface StorageUnavailableError {
  readonly kind: 'StorageUnavailable';
  readonly message: string;
  /** The original browser/runtime error, if available. */
  readonly cause?: unknown;
}

/**
 * SerializationError
 *
 * A value could not be serialized to a string for storage.
 *
 * Common causes:
 * - Circular references in the value
 * - Non-serializable types (e.g. functions, Symbols)
 */
export interface SerializationError {
  readonly kind: 'SerializationError';
  readonly namespace: string;
  readonly key: string;
  readonly message: string;
  readonly cause?: unknown;
}

/**
 * DeserializationError
 *
 * A stored string could not be deserialized back into a value.
 *
 * Common causes:
 * - Corrupted or truncated stored data
 * - Data written by an incompatible version
 */
export interface DeserializationError {
  readonly kind: 'DeserializationError';
  readonly namespace: string;
  readonly key: string;
  readonly message: string;
  readonly cause?: unknown;
}

/**
 * StorageWriteError
 *
 * A write operation failed after serialization succeeded.
 *
 * Common causes:
 * - Storage quota exceeded
 * - Storage unavailable mid-session
 */
export interface StorageWriteError {
  readonly kind: 'StorageWriteError';
  readonly namespace: string;
  readonly key: string;
  readonly message: string;
  readonly cause?: unknown;
}

/**
 * StorageReadError
 *
 * A read operation failed for a reason other than a missing key.
 * Missing keys are represented by a null return, not an error.
 */
export interface StorageReadError {
  readonly kind: 'StorageReadError';
  readonly namespace: string;
  readonly key: string;
  readonly message: string;
  readonly cause?: unknown;
}

// ─── Union ────────────────────────────────────────────────────────────────────

/**
 * AnyStorageError
 *
 * Discriminated union of all storage error types.
 * Narrow with: if (error.kind === 'DeserializationError') { ... }
 */
export type AnyStorageError =
  | StorageUnavailableError
  | SerializationError
  | DeserializationError
  | StorageWriteError
  | StorageReadError;
