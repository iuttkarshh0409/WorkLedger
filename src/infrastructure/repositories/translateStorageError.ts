/**
 * Storage Error Translation
 *
 * Translates infrastructure storage errors into domain error types.
 *
 * Responsibility boundary:
 *   Storage Layer     → AnyStorageError
 *   Repository Layer  → translateStorageError()
 *   Domain Layer      → AnyDomainError
 *
 * The Application Layer (services, UI) never sees a StorageError.
 * This enforces the Clean Architecture dependency rule:
 * Domain is independent of Infrastructure.
 *
 * @see docs/09_technical_architecture.md (Dependency Rule)
 * @see docs/03.5_system_architecture.md (Layer Isolation)
 */

import type { AnyStorageError } from '../storage';
import type { AnyDomainError } from '@domain';

/**
 * translateStorageError
 *
 * Maps a StorageError to its corresponding DomainError.
 *
 * Translation rules:
 *   StorageUnavailable   → DomainError (generic — no specific type fits)
 *   SerializationError   → DomainError (data corruption — not a business violation)
 *   DeserializationError → DomainError (data corruption)
 *   StorageWriteError    → DomainError (infrastructure failure)
 *   StorageReadError     → DomainError (infrastructure failure)
 *
 * Note: NotFoundError is never returned here because missing keys are
 * represented by `null` at the storage layer. Repositories decide when
 * a missing entity should become a NotFoundError.
 */
export function translateStorageError(
  error: AnyStorageError,
  context?: string,
): AnyDomainError {
  const prefix = context ? `${context}: ` : '';

  switch (error.kind) {
    case 'StorageUnavailable':
      return {
        kind: 'DomainError',
        message: `${prefix}Storage is unavailable. ${error.message}`,
      };

    case 'SerializationError':
      return {
        kind: 'DomainError',
        message:
          `${prefix}Failed to serialize data for key "${error.namespace}:${error.key}". ` +
          'This may indicate a circular reference or non-serializable value.',
      };

    case 'DeserializationError':
      return {
        kind: 'DomainError',
        message:
          `${prefix}Failed to deserialize stored data for key "${error.namespace}:${error.key}". ` +
          'The stored data may be corrupted or incompatible with the current version.',
      };

    case 'StorageWriteError':
      return {
        kind: 'DomainError',
        message:
          `${prefix}Failed to write data for key "${error.namespace}:${error.key}". ` +
          'Storage quota may be exceeded or storage may have become unavailable.',
      };

    case 'StorageReadError':
      return {
        kind: 'DomainError',
        message:
          `${prefix}Failed to read data for key "${error.namespace}:${error.key}". ` +
          'Storage may be unavailable or inaccessible.',
      };
  }
}
