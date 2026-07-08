/**
 * Activity Validation
 *
 * Structural validation for Activity entities and input types.
 *
 * Scope:
 * - Required field presence
 * - Valid ActivityType enum membership
 * - Timestamp presence
 *
 * Out of scope (belongs to services):
 * - Workspace / Assignment / Contributor existence checks
 * - Business rules about which activity types are allowed in which states
 * - Metadata shape validation (varies per ActivityType)
 *
 * Note: Activities have no update validator because they are append-only.
 */

import { ActivityType } from '../shared/enums';
import {
  type ValidationResult,
  valid,
  invalid,
  isNonEmptyString,
  isValidTimestamp,
} from '../shared/types';
import type { Activity } from './entity';
import type { CreateActivityInput } from './types';

const VALID_TYPES = Object.values(ActivityType);

/**
 * validateActivity
 *
 * Validates a fully-constructed Activity entity.
 */
export function validateActivity(activity: Activity): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(activity.id)) {
    errors.push('Activity id is required.');
  }
  if (!isNonEmptyString(activity.workspaceId)) {
    errors.push('Activity workspaceId is required.');
  }
  if (!isNonEmptyString(activity.performedBy)) {
    errors.push('Activity performedBy is required.');
  }
  if (!VALID_TYPES.includes(activity.type)) {
    errors.push(`Activity type must be one of: ${VALID_TYPES.join(', ')}.`);
  }
  if (!isValidTimestamp(activity.timestamp)) {
    errors.push('Activity timestamp must be a valid timestamp.');
  }
  if (!isNonEmptyString(activity.createdAt)) {
    errors.push('Activity createdAt is required.');
  }
  if (
    activity.metadata !== null &&
    (typeof activity.metadata !== 'object' ||
      Array.isArray(activity.metadata))
  ) {
    errors.push('Activity metadata must be a plain object.');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * validateCreateActivityInput
 *
 * Validates the input required to record a new Activity.
 */
export function validateCreateActivityInput(
  input: CreateActivityInput,
): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.workspaceId)) {
    errors.push('Activity workspaceId is required.');
  }
  if (!isNonEmptyString(input.performedBy)) {
    errors.push('Activity performedBy is required.');
  }
  if (!VALID_TYPES.includes(input.type)) {
    errors.push(`Activity type must be one of: ${VALID_TYPES.join(', ')}.`);
  }
  if (!isValidTimestamp(input.timestamp)) {
    errors.push('Activity timestamp must be a valid timestamp.');
  }
  if (
    input.metadata !== undefined &&
    input.metadata !== null &&
    (typeof input.metadata !== 'object' || Array.isArray(input.metadata))
  ) {
    errors.push('Activity metadata must be a plain object.');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}
