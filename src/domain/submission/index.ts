/**
 * Submission Domain Module
 *
 * Owns the Submission entity — a Contributor's response to an Assignment.
 * Each revision produces a new Submission record, preserving full history.
 *
 * @see 02_domain_model.md (Submission)
 * @see 03_data_schema.md (Submission Schema, Attachment Schema)
 */

export type { Submission, Attachment } from './entity';
export type { CreateSubmissionInput, UpdateSubmissionInput } from './types';
export {
  validateAttachment,
  validateSubmission,
  validateCreateSubmissionInput,
} from './validation';
export type { ISubmissionRepository } from './repository';
