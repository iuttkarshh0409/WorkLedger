/**
 * Contributor Domain Module
 *
 * Owns the Contributor entity — every individual who performs or manages
 * work inside a Workspace.
 *
 * @see 02_domain_model.md (Contributor)
 * @see 03_data_schema.md (Contributor Schema)
 * @see 04.5_permission_model.md (Core Roles)
 */

export type { Contributor } from './entity';
export type { CreateContributorInput, UpdateContributorInput } from './types';
export {
  validateContributor,
  validateCreateContributorInput,
} from './validation';
export type { IContributorRepository } from './repository';
