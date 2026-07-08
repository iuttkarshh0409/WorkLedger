/**
 * Assignment Domain Module
 *
 * Owns the Assignment entity — a unit of delegated work that progresses
 * through a defined lifecycle and becomes a permanent Ledger record.
 *
 * @see 02_domain_model.md (Assignment)
 * @see 03_data_schema.md (Assignment Schema)
 * @see 04_assignment_lifecycle.md (Lifecycle Overview)
 */

export type { Assignment } from './entity';
export type { CreateAssignmentInput, UpdateAssignmentInput } from './types';
export {
  validateAssignment,
  validateCreateAssignmentInput,
} from './validation';
export type { IAssignmentRepository } from './repository';
