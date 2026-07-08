/**
 * Shared Types
 *
 * Application-wide TypeScript types and interfaces.
 *
 * Milestone 1: Foundation types only.
 * Domain-specific types will be defined inside their respective domain modules.
 */

// ─── Utility types ───────────────────────────────────────────────────────────

/** Makes all properties in T non-nullable */
export type NonNullableProperties<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

/** Extracts the value type of a const object */
export type ValueOf<T> = T[keyof T];

/** A record with string keys and unknown values — safe alternative to `any` */
export type UnknownRecord = Record<string, unknown>;
