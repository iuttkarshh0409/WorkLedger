/**
 * Contributor Validation
 *
 * Structural validation for Contributor entities and input types.
 *
 * Scope:
 * - Required field presence
 * - Valid enum membership
 * - Non-empty string values
 * - Basic email format check
 *
 * Out of scope (belongs to services):
 * - Duplicate email checks
 * - Workspace existence checks
 * - Permission enforcement
 */

import { ContributorRole, ContributorStatus } from '../shared/enums';
import {
  type ValidationResult,
  valid,
  invalid,
  isNonEmptyString,
  isValidTimestamp,
} from '../shared/types';
import type { Contributor } from './entity';
import type { CreateContributorInput } from './types';

const VALID_ROLES    = Object.values(ContributorRole);
const VALID_STATUSES = Object.values(ContributorStatus);

/** Minimal structural email check — not RFC 5322 compliant by design. */
function isEmailShaped(value: unknown): value is string {
  return isNonEmptyString(value) && value.includes('@') && value.includes('.');
}

/**
 * validateContributor
 *
 * Validates a fully-constructed Contributor entity.
 */
export function validateContributor(contributor: Contributor): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(contributor.id)) {
    errors.push('Contributor id is required.');
  }
  if (!isNonEmptyString(contributor.workspaceId)) {
    errors.push('Contributor workspaceId is required.');
  }
  if (!isNonEmptyString(contributor.name)) {
    errors.push('Contributor name is required.');
  }
  if (!isEmailShaped(contributor.email)) {
    errors.push('Contributor email must be a valid email address.');
  }
  if (!VALID_ROLES.includes(contributor.role)) {
    errors.push(`Contributor role must be one of: ${VALID_ROLES.join(', ')}.`);
  }
  if (!isValidTimestamp(contributor.joinedAt)) {
    errors.push('Contributor joinedAt must be a valid timestamp.');
  }
  if (!VALID_STATUSES.includes(contributor.status)) {
    errors.push(`Contributor status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }
  if (!isNonEmptyString(contributor.createdAt)) {
    errors.push('Contributor createdAt is required.');
  }
  if (!isNonEmptyString(contributor.updatedAt)) {
    errors.push('Contributor updatedAt is required.');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * validateCreateContributorInput
 *
 * Validates the input required to create a new Contributor.
 */
export function validateCreateContributorInput(
  input: CreateContributorInput,
): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.workspaceId)) {
    errors.push('Contributor workspaceId is required.');
  }
  if (!isNonEmptyString(input.name)) {
    errors.push('Contributor name is required.');
  }
  if (!isEmailShaped(input.email)) {
    errors.push('Contributor email must be a valid email address.');
  }
  if (!VALID_ROLES.includes(input.role)) {
    errors.push(`Contributor role must be one of: ${VALID_ROLES.join(', ')}.`);
  }
  if (input.joinedAt !== undefined && !isValidTimestamp(input.joinedAt)) {
    errors.push('Contributor joinedAt must be a valid timestamp.');
  }
  if (input.status !== undefined && !VALID_STATUSES.includes(input.status)) {
    errors.push(`Contributor status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  return errors.length > 0 ? invalid(errors) : valid();
}
