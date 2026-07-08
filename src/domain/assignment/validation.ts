/**
 * Assignment Validation
 *
 * Structural validation for Assignment entities and input types.
 *
 * Scope:
 * - Required field presence
 * - Valid enum membership
 * - Timestamp presence
 * - Non-negative revision count
 *
 * Out of scope (belongs to services):
 * - State transition rules (Draft → Assigned → Accepted …)
 * - Deadline must be in the future
 * - Contributor and Reviewer existence checks
 * - Workspace existence checks
 * - Self-review prevention
 */

import { AssignmentStatus, AssignmentPriority } from '../shared/enums';
import {
  type ValidationResult,
  valid,
  invalid,
  isNonEmptyString,
  isValidTimestamp,
} from '../shared/types';
import type { Assignment } from './entity';
import type { CreateAssignmentInput } from './types';

const VALID_STATUSES   = Object.values(AssignmentStatus);
const VALID_PRIORITIES = Object.values(AssignmentPriority);

/**
 * validateAssignment
 *
 * Validates a fully-constructed Assignment entity.
 */
export function validateAssignment(assignment: Assignment): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(assignment.id)) {
    errors.push('Assignment id is required.');
  }
  if (!isNonEmptyString(assignment.workspaceId)) {
    errors.push('Assignment workspaceId is required.');
  }
  if (!isNonEmptyString(assignment.contributorId)) {
    errors.push('Assignment contributorId is required.');
  }
  // reviewerId is intentionally nullable — a Reviewer may be assigned later
  if (assignment.reviewerId !== null && !isNonEmptyString(assignment.reviewerId)) {
    errors.push('Assignment reviewerId must be a non-empty string when provided.');
  }
  if (!isNonEmptyString(assignment.title)) {
    errors.push('Assignment title is required.');
  }
  if (!VALID_PRIORITIES.includes(assignment.priority)) {
    errors.push(`Assignment priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }
  if (!isValidTimestamp(assignment.assignedOn)) {
    errors.push('Assignment assignedOn must be a valid timestamp.');
  }
  if (!isValidTimestamp(assignment.deadline)) {
    errors.push('Assignment deadline must be a valid timestamp.');
  }
  if (!VALID_STATUSES.includes(assignment.status)) {
    errors.push(`Assignment status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }
  if (
    typeof assignment.revisionCount !== 'number' ||
    !Number.isInteger(assignment.revisionCount) ||
    assignment.revisionCount < 0
  ) {
    errors.push('Assignment revisionCount must be a non-negative integer.');
  }
  if (!isNonEmptyString(assignment.createdAt)) {
    errors.push('Assignment createdAt is required.');
  }
  if (!isNonEmptyString(assignment.updatedAt)) {
    errors.push('Assignment updatedAt is required.');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * validateCreateAssignmentInput
 *
 * Validates the input required to create a new Assignment.
 */
export function validateCreateAssignmentInput(
  input: CreateAssignmentInput,
): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.workspaceId)) {
    errors.push('Assignment workspaceId is required.');
  }
  if (!isNonEmptyString(input.contributorId)) {
    errors.push('Assignment contributorId is required.');
  }
  // reviewerId is optional — may be assigned after creation
  if (
    input.reviewerId !== undefined &&
    input.reviewerId !== null &&
    !isNonEmptyString(input.reviewerId)
  ) {
    errors.push('Assignment reviewerId must be a non-empty string when provided.');
  }
  if (!isNonEmptyString(input.title)) {
    errors.push('Assignment title is required.');
  }
  if (!isValidTimestamp(input.assignedOn)) {
    errors.push('Assignment assignedOn must be a valid timestamp.');
  }
  if (!isValidTimestamp(input.deadline)) {
    errors.push('Assignment deadline must be a valid timestamp.');
  }
  if (
    input.priority !== undefined &&
    !VALID_PRIORITIES.includes(input.priority)
  ) {
    errors.push(`Assignment priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }
  if (
    input.status !== undefined &&
    !VALID_STATUSES.includes(input.status)
  ) {
    errors.push(`Assignment status must be one of: ${VALID_STATUSES.join(', ')}.`);
  }

  return errors.length > 0 ? invalid(errors) : valid();
}
