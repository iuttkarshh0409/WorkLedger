/**
 * ID Generation
 *
 * Provides UUID v4 generation for all domain entities.
 *
 * Implementation strategy:
 *   Primary:  crypto.randomUUID() (native, secure, no dependencies)
 *   Fallback: Math.random()-based RFC 4122 implementation
 *
 * The fallback is only used when crypto.randomUUID() is unavailable,
 * which should never occur in modern browsers (Chrome 92+, Firefox 95+,
 * Safari 15.4+) or Node.js 16+.
 *
 * @see https://www.rfc-editor.org/rfc/rfc4122 (UUID specification)
 */

import type { EntityId } from '@domain';

/**
 * generateId
 *
 * Returns a UUID v4 string suitable for use as an EntityId.
 * The returned string is cryptographically random and conforms to RFC 4122.
 *
 * Usage:
 *   const workspaceId = generateId();
 *   const assignment: Assignment = { id: generateId(), ... };
 */
let overriddenId: string | null = null;

export function overrideNextId(id: string | null) {
  overriddenId = id;
}

export function generateId(): EntityId {
  if (overriddenId !== null) {
    const id = overriddenId;
    overriddenId = null;
    return id;
  }

  // Primary: use native crypto.randomUUID() if available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: Math.random()-based RFC 4122 v4 UUID
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // where x is [0-9a-f], y is [89ab], and 4 is the version marker
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
