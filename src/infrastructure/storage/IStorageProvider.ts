/**
 * IStorageProvider
 *
 * Persistence contract for the storage infrastructure layer.
 *
 * Responsibilities:
 * - Reading, writing, removing, and checking existence of values.
 * - Namespace-aware key management.
 * - Serialization and deserialization of structured data.
 *
 * Out of scope:
 * - Domain entities
 * - Business rules
 * - Repository logic
 * - Caching, synchronization, versioning, or migrations
 *
 * Storage is organized into namespaces (collections) and keys (identifiers).
 * The storage provider knows nothing about what the keys mean — that
 * responsibility belongs to repositories.
 *
 * Example key space:
 *   namespace: 'workspaces',  key: '<uuid>'
 *   namespace: 'assignments', key: '<uuid>'
 *
 * All methods return Promises so that implementations backed by
 * asynchronous stores (IndexedDB, remote APIs) satisfy this contract
 * without any changes at the repository layer.
 *
 * @see docs/09_technical_architecture.md (Infrastructure Layer)
 * @see docs/03.5_system_architecture.md (Infrastructure may evolve without affecting business logic)
 */

import type { AnyStorageError } from './errors';

// ─── Storage Result ───────────────────────────────────────────────────────────

/**
 * StorageResult<T>
 *
 * Every storage operation returns a typed result rather than throwing.
 * Callers (repositories) translate storage errors into domain errors.
 */
export type StorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: AnyStorageError };

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IStorageProvider {
  /**
   * Retrieves the value stored at (namespace, key).
   * Returns `{ ok: true, value: null }` when the key does not exist —
   * a missing key is a normal condition, not an error.
   */
  get<T>(namespace: string, key: string): Promise<StorageResult<T | null>>;

  /**
   * Stores value at (namespace, key), overwriting any existing value.
   */
  set<T>(namespace: string, key: string, value: T): Promise<StorageResult<void>>;

  /**
   * Removes the entry at (namespace, key).
   * Resolves successfully even if the key did not exist.
   */
  remove(namespace: string, key: string): Promise<StorageResult<void>>;

  /**
   * Returns true if a value exists at (namespace, key).
   */
  has(namespace: string, key: string): Promise<StorageResult<boolean>>;

  /**
   * Returns all values stored in the given namespace.
   * Returns an empty array when the namespace has no entries.
   */
  list<T>(namespace: string): Promise<StorageResult<T[]>>;

  /**
   * Removes all entries within the given namespace.
   * Other namespaces are not affected.
   */
  clear(namespace: string): Promise<StorageResult<void>>;
}
