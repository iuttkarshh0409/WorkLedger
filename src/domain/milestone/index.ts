/**
 * Milestone Domain Module
 *
 * Owns the Milestone entity — a grouping of related Assignments into a
 * meaningful phase of work.
 *
 * @see 02_domain_model.md (Milestone)
 * @see 03_data_schema.md (Milestone Schema)
 */

export type { Milestone } from './entity';
export type { CreateMilestoneInput, UpdateMilestoneInput } from './types';
export {
  validateMilestone,
  validateCreateMilestoneInput,
} from './validation';
export type { IMilestoneRepository } from './repository';
