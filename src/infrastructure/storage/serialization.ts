/**
 * Serialization
 *
 * Lossless encode/decode helpers for the storage layer.
 *
 * Contract:
 *   serialize(value) → JSON string
 *   deserialize<T>(json) → T
 *
 * The round-trip must be lossless for all domain entity shapes:
 *   entity → serialize() → deserialize() → entity (deep equal)
 *
 * Rules:
 * - No business transformations. Encoding only.
 * - No knowledge of domain entities.
 * - Both functions return a typed Result rather than throwing,
 *   keeping error handling explicit at the call site.
 *
 * @see docs/09_technical_architecture.md (Infrastructure Layer)
 */

import type {
  SerializationError,
  DeserializationError,
} from './errors';

// ─── Result types ─────────────────────────────────────────────────────────────

export type SerializeResult =
  | { ok: true; value: string }
  | { ok: false; error: SerializationError };

export type DeserializeResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: DeserializationError };

// ─── Serialize ────────────────────────────────────────────────────────────────

/**
 * serialize
 *
 * Encodes a value to a JSON string.
 * Returns an error result instead of throwing on failure.
 *
 * @param value  - The value to encode. Must be JSON-compatible.
 * @param namespace - Used only for error context.
 * @param key       - Used only for error context.
 */
export function serialize(
  value: unknown,
  namespace: string,
  key: string,
): SerializeResult {
  try {
    return { ok: true, value: JSON.stringify(value) };
  } catch (cause) {
    return {
      ok: false,
      error: {
        kind: 'SerializationError',
        namespace,
        key,
        message: `Failed to serialize value for key "${namespace}:${key}".`,
        cause,
      },
    };
  }
}

// ─── Deserialize ──────────────────────────────────────────────────────────────

/**
 * deserialize
 *
 * Decodes a JSON string back to a typed value.
 * Returns an error result instead of throwing on failure.
 *
 * The caller is responsible for verifying the shape of the returned value.
 * This function performs JSON decoding only — no runtime type validation.
 *
 * @param json      - The raw JSON string from storage.
 * @param namespace - Used only for error context.
 * @param key       - Used only for error context.
 */
export function deserialize<T>(
  json: string,
  namespace: string,
  key: string,
): DeserializeResult<T> {
  try {
    return { ok: true, value: JSON.parse(json) as T };
  } catch (cause) {
    return {
      ok: false,
      error: {
        kind: 'DeserializationError',
        namespace,
        key,
        message: `Failed to deserialize stored value for key "${namespace}:${key}".`,
        cause,
      },
    };
  }
}
