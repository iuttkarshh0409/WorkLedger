/**
 * Storage Namespaces
 *
 * Canonical namespace strings used by all repositories.
 *
 * Rules:
 * - Every repository must import its namespace from this file.
 * - No repository may hardcode a namespace string directly.
 * - Namespace strings must be lowercase, plural, and hyphen-separated.
 * - Adding a new entity requires adding its namespace here first.
 *
 * These strings become the middle segment of every localStorage key:
 *   wl:<namespace>:<id>
 *
 * @see src/infrastructure/storage/LocalStorageProvider.ts (key convention)
 */

export const STORAGE_NAMESPACES = {
  workspaces:    'workspaces',
  contributors:  'contributors',
  milestones:    'milestones',
  assignments:   'assignments',
  submissions:   'submissions',
  reviews:       'reviews',
  activities:    'activities',
} as const;

export type StorageNamespace =
  (typeof STORAGE_NAMESPACES)[keyof typeof STORAGE_NAMESPACES];
