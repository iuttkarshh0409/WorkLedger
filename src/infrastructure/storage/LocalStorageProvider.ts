/**
 * LocalStorageProvider
 *
 * MVP persistence implementation of IStorageProvider backed by
 * the browser's localStorage API.
 *
 * Version strategy:
 *   MVP     → LocalStorageProvider (this file)
 *   V2      → IndexedDBProvider or RemoteStorageProvider
 *   V3+     → Cloud-backed provider
 *
 * Repositories depend on IStorageProvider, not on this class.
 * Swapping providers requires no changes to repository code.
 *
 * Known constraints:
 * - localStorage is synchronous; all operations are wrapped in
 *   resolved Promises to satisfy the async IStorageProvider contract.
 * - Storage quota is browser-defined (~5 MB typical). Quota exhaustion
 *   is caught and returned as a StorageWriteError.
 * - localStorage is not available in all environments (private browsing
 *   with strict settings, server-side rendering). Availability is checked
 *   via the static isAvailable() method before construction.
 *
 * Key convention:
 *   Keys in localStorage are stored as "wl:<namespace>:<key>"
 *   The "wl:" prefix prevents collisions with other scripts on the origin.
 *   The namespace prefix isolates collections from each other.
 *
 * @see IStorageProvider
 * @see docs/09_technical_architecture.md (MVP — Local JSON Data)
 * @see docs/11_roadmap.md (Phase 1 — MVP, Phase 2 — Collaboration)
 */

import type { IStorageProvider, StorageResult } from './IStorageProvider';
import type { StorageUnavailableError } from './errors';
import { serialize, deserialize } from './serialization';

// ─── Key convention ───────────────────────────────────────────────────────────

const APP_PREFIX = 'wl';

/**
 * Builds the full localStorage key from namespace and entity key.
 * Format: "wl:<namespace>:<key>"
 */
function buildStorageKey(namespace: string, key: string): string {
  return `${APP_PREFIX}:${namespace}:${key}`;
}

/**
 * Builds the namespace prefix used to scan all keys in a namespace.
 * Format: "wl:<namespace>:"
 */
function buildNamespacePrefix(namespace: string): string {
  return `${APP_PREFIX}:${namespace}:`;
}

// ─── Availability check ───────────────────────────────────────────────────────

/**
 * isLocalStorageAvailable
 *
 * Probes localStorage availability without throwing.
 * Use before constructing LocalStorageProvider.
 */
function isLocalStorageAvailable(): boolean {
  try {
    const probe = '__wl_probe__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

// ─── Implementation ───────────────────────────────────────────────────────────

export class LocalStorageProvider implements IStorageProvider {
  /**
   * Returns true when localStorage is available in the current environment.
   * Call this before constructing an instance when availability is uncertain.
   */
  static isAvailable(): boolean {
    return isLocalStorageAvailable();
  }

  constructor() {
    if (!isLocalStorageAvailable()) {
      const error: StorageUnavailableError = {
        kind: 'StorageUnavailable',
        message:
          'localStorage is not available in this environment. ' +
          'This may be caused by private browsing mode or a browser security policy.',
      };
      // Construction-time failure is the one case where we throw,
      // because the provider is unusable and the caller must handle it
      // before attempting any operations.
      throw error;
    }
  }

  // ─── get ───────────────────────────────────────────────────────────────────

  async get<T>(
    namespace: string,
    key: string,
  ): Promise<StorageResult<T | null>> {
    try {
      const raw = localStorage.getItem(buildStorageKey(namespace, key));

      if (raw === null) {
        return { ok: true, value: null };
      }

      const result = deserialize<T>(raw, namespace, key);
      if (!result.ok) {
        return { ok: false, error: result.error };
      }

      return { ok: true, value: result.value };
    } catch (cause) {
      return {
        ok: false,
        error: {
          kind: 'StorageReadError',
          namespace,
          key,
          message: `Unexpected error reading key "${namespace}:${key}".`,
          cause,
        },
      };
    }
  }

  // ─── set ───────────────────────────────────────────────────────────────────

  async set<T>(
    namespace: string,
    key: string,
    value: T,
  ): Promise<StorageResult<void>> {
    const serialized = serialize(value, namespace, key);
    if (!serialized.ok) {
      return { ok: false, error: serialized.error };
    }

    try {
      localStorage.setItem(buildStorageKey(namespace, key), serialized.value);
      return { ok: true, value: undefined };
    } catch (cause) {
      return {
        ok: false,
        error: {
          kind: 'StorageWriteError',
          namespace,
          key,
          message:
            `Failed to write key "${namespace}:${key}". ` +
            'Storage quota may be exceeded.',
          cause,
        },
      };
    }
  }

  // ─── remove ────────────────────────────────────────────────────────────────

  async remove(namespace: string, key: string): Promise<StorageResult<void>> {
    try {
      localStorage.removeItem(buildStorageKey(namespace, key));
      return { ok: true, value: undefined };
    } catch (cause) {
      return {
        ok: false,
        error: {
          kind: 'StorageWriteError',
          namespace,
          key,
          message: `Failed to remove key "${namespace}:${key}".`,
          cause,
        },
      };
    }
  }

  // ─── has ───────────────────────────────────────────────────────────────────

  async has(namespace: string, key: string): Promise<StorageResult<boolean>> {
    try {
      const exists =
        localStorage.getItem(buildStorageKey(namespace, key)) !== null;
      return { ok: true, value: exists };
    } catch (cause) {
      return {
        ok: false,
        error: {
          kind: 'StorageReadError',
          namespace,
          key,
          message: `Failed to check existence of key "${namespace}:${key}".`,
          cause,
        },
      };
    }
  }

  // ─── list ──────────────────────────────────────────────────────────────────

  async list<T>(namespace: string): Promise<StorageResult<T[]>> {
    const prefix = buildNamespacePrefix(namespace);
    const results: T[] = [];

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey === null || !storageKey.startsWith(prefix)) continue;

        // Extract the entity key from the full storage key
        const entityKey = storageKey.slice(prefix.length);
        const raw = localStorage.getItem(storageKey);

        if (raw === null) continue;

        const result = deserialize<T>(raw, namespace, entityKey);
        if (!result.ok) {
          return { ok: false, error: result.error };
        }

        results.push(result.value);
      }

      return { ok: true, value: results };
    } catch (cause) {
      return {
        ok: false,
        error: {
          kind: 'StorageReadError',
          namespace,
          key: '*',
          message: `Failed to list entries in namespace "${namespace}".`,
          cause,
        },
      };
    }
  }

  // ─── clear ─────────────────────────────────────────────────────────────────

  async clear(namespace: string): Promise<StorageResult<void>> {
    const prefix = buildNamespacePrefix(namespace);

    try {
      // Collect keys first — modifying localStorage during iteration is unsafe
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i);
        if (storageKey !== null && storageKey.startsWith(prefix)) {
          keysToRemove.push(storageKey);
        }
      }

      for (const storageKey of keysToRemove) {
        localStorage.removeItem(storageKey);
      }

      return { ok: true, value: undefined };
    } catch (cause) {
      return {
        ok: false,
        error: {
          kind: 'StorageWriteError',
          namespace,
          key: '*',
          message: `Failed to clear namespace "${namespace}".`,
          cause,
        },
      };
    }
  }
}
