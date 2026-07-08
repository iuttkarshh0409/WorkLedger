/**
 * Workspace Validation
 *
 * Structural validation for Workspace entities and input types.
 *
 * Scope:
 * - Required field presence
 * - Valid enum membership
 * - Non-empty string values
 *
 * Out of scope (belongs to services):
 * - Duplicate name checks
 * - Owner existence checks
 * - Permission enforcement
 */

import { WorkspaceStatus } from '../shared/enums';
import {
  type ValidationResult,
  valid,
  invalid,
  isNonEmptyString,
} from '../shared/types';
import type { Workspace } from './entity';
import type { CreateWorkspaceInput } from './types';

const VALID_STATUSES = Object.values(WorkspaceStatus);

/**
 * validateWorkspace
 *
 * Validates a fully-constructed Workspace entity.
 */
export function validateWorkspace(workspace: Workspace): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(workspace.id)) {
    errors.push('Workspace id is required.');
  }
  if (!isNonEmptyString(workspace.name)) {
    errors.push('Workspace name is required.');
  }
  if (!isNonEmptyString(workspace.ownerId)) {
    errors.push('Workspace ownerId is required.');
  }
  if (!isNonEmptyString(workspace.createdAt)) {
    errors.push('Workspace createdAt is required.');
  }
  if (!isNonEmptyString(workspace.updatedAt)) {
    errors.push('Workspace updatedAt is required.');
  }
  if (!VALID_STATUSES.includes(workspace.status)) {
    errors.push(`Workspace status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * validateCreateWorkspaceInput
 *
 * Validates the input required to create a new Workspace.
 */
export function validateCreateWorkspaceInput(
  input: CreateWorkspaceInput,
): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.name)) {
    errors.push('Workspace name is required.');
  }
  if (!isNonEmptyString(input.ownerId)) {
    errors.push('Workspace ownerId is required.');
  }
  if (
    input.status !== undefined &&
    !VALID_STATUSES.includes(input.status)
  ) {
    errors.push(`Workspace status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  return errors.length > 0 ? invalid(errors) : valid();
}
