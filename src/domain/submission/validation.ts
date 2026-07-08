/**
 * Submission Validation
 *
 * Structural validation for Submission entities, Attachments, and input types.
 *
 * Scope:
 * - Required field presence
 * - Attachment structural integrity (id, name, url)
 * - Timestamp presence
 *
 * Out of scope (belongs to services):
 * - Assignment must exist and be in a valid state for submission
 * - Contributor must own the Assignment
 * - Submission immutability during active review
 * - URL format validation beyond non-empty string
 */

import {
  type ValidationResult,
  valid,
  invalid,
  isNonEmptyString,
  isValidTimestamp,
} from '../shared/types';
import type { Submission, Attachment } from './entity';
import type { CreateSubmissionInput } from './types';

// ─── Attachment validation ────────────────────────────────────────────────────

/**
 * validateAttachment
 *
 * Validates a single Attachment for structural correctness.
 */
export function validateAttachment(attachment: Attachment): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(attachment.id)) {
    errors.push('Attachment id is required.');
  }
  if (!isNonEmptyString(attachment.name)) {
    errors.push('Attachment name is required.');
  }
  if (!isNonEmptyString(attachment.url)) {
    errors.push('Attachment url is required.');
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

// ─── Submission validation ────────────────────────────────────────────────────

/**
 * validateSubmission
 *
 * Validates a fully-constructed Submission entity.
 */
export function validateSubmission(submission: Submission): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(submission.id)) {
    errors.push('Submission id is required.');
  }
  if (!isNonEmptyString(submission.assignmentId)) {
    errors.push('Submission assignmentId is required.');
  }
  if (!isValidTimestamp(submission.submittedOn)) {
    errors.push('Submission submittedOn must be a valid timestamp.');
  }
  if (!isNonEmptyString(submission.createdAt)) {
    errors.push('Submission createdAt is required.');
  }
  if (!isNonEmptyString(submission.updatedAt)) {
    errors.push('Submission updatedAt is required.');
  }

  // Validate each attachment if present
  if (!Array.isArray(submission.attachments)) {
    errors.push('Submission attachments must be an array.');
  } else {
    submission.attachments.forEach((attachment, index) => {
      const result = validateAttachment(attachment);
      if (!result.valid) {
        result.errors.forEach((e) =>
          errors.push(`Attachment[${index}]: ${e}`),
        );
      }
    });
  }

  return errors.length > 0 ? invalid(errors) : valid();
}

/**
 * validateCreateSubmissionInput
 *
 * Validates the input required to create a new Submission.
 */
export function validateCreateSubmissionInput(
  input: CreateSubmissionInput,
): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.assignmentId)) {
    errors.push('Submission assignmentId is required.');
  }
  if (!isValidTimestamp(input.submittedOn)) {
    errors.push('Submission submittedOn must be a valid timestamp.');
  }
  if (input.attachments !== undefined) {
    if (!Array.isArray(input.attachments)) {
      errors.push('Submission attachments must be an array.');
    } else {
      input.attachments.forEach((attachment, index) => {
        const result = validateAttachment(attachment);
        if (!result.valid) {
          result.errors.forEach((e) =>
            errors.push(`Attachment[${index}]: ${e}`),
          );
        }
      });
    }
  }

  return errors.length > 0 ? invalid(errors) : valid();
}
