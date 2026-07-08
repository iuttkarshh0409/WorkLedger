/**
 * Activity Domain Module
 *
 * Owns the Activity entity — every significant event recorded in a Workspace.
 * Activities are append-only and power Timelines, audit history, and analytics.
 *
 * @see 02_domain_model.md (Activity)
 * @see 03_data_schema.md (Activity Schema)
 * @see 04_assignment_lifecycle.md (Automatic System Actions)
 */

export type { Activity } from './entity';
export type { CreateActivityInput } from './types';
export {
  validateActivity,
  validateCreateActivityInput,
} from './validation';
export type { IActivityRepository } from './repository';
