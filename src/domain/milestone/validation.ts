/**
 * Milestone Validation
 *
 * Structural validation for Milestone entities and input types.
 *
 * Scope:
 * - Required field presence
 * - Valid enum membership
 * - Timestamp presence (not ordering — deadline ordering is a business rule)
 *
 * Out of scope (belongs to services):
 * - startDate must precede deadline
 * - Workspace existence checks
 * - Milestone overlap detection
 */

import { MilestoneStatus } from '../shared/enums';
import {
  type ValidationResult,
  valid,
  invalid,
  isNonEmptyString,
  isValidTimestamp,
} from '../shared/types';
import type { Milestone } from './entity';
import type { CreateMilestoneInput } from './types';

const VALID_STATUSES = Object.values(MilestoneStatus);

/**
 * validateMilestone
 *
 * Validates a fully-constructed Milestone entity.
 */
export function validateMilestone(milestone: Milestone): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(milestone.id)) {
    errors.push('Milestone id is required.');
  }
  if (!isNonEmptyString(milestone.workspaceId)) {
    errors.push('Milestone workspaceId is required.');
  }
  if (!isNonEmptyString(milestone.title)) {
    errors.push('Milestone title is required.');
  }
  if (!isValidTimestamp(milestone.startDate)) {
    errors.push('Milestone startDate must be a valid timestamp.');
  }
  if (!isValidTimestamp(milestone.deadline)) {
    errors.push('Milestone deadline must be a valid timestamp.');
  }
  if (!VALID_STATUSES.includes(milestone.status)) {
    errors.push(`Milestone status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }
  if (!isNonEmptyString(milestone.createdAt)) {
    errors.push('Milestone createdAt is required.');
  }
  if (!isNonEmptyString(milestone.updatedAt)) {
    errors.push('Milestone updatedAt is required.');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * validateCreateMilestoneInput
 *
 * Validates the input required to create a new Milestone.
 */
export function validateCreateMilestoneInput(
  input: CreateMilestoneInput,
): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.workspaceId)) {
    errors.push('Milestone workspaceId is required.');
  }
  if (!isNonEmptyString(input.title)) {
    errors.push('Milestone title is required.');
  }
  if (!isValidTimestamp(input.startDate)) {
    errors.push('Milestone startDate must be a valid timestamp.');
  }
  if (!isValidTimestamp(input.deadline)) {
    errors.push('Milestone deadline must be a valid timestamp.');
  }
  if (input.status !== undefined && !VALID_STATUSES.includes(input.status)) {
    errors.push(`Milestone status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  return errors.length > 0 ? invalid(errors) : valid();
}
