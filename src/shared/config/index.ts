/**
 * Shared Config
 *
 * Application-wide configuration values.
 *
 * Rules:
 * - No secrets or environment credentials here.
 * - Values that change per environment belong in .env files.
 * - Values that are stable across environments live here.
 */

export const APP_CONFIG = {
  name: 'WorkLedger',
  version: '0.1.0',
} as const;
