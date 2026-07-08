/**
 * Workspace Domain Module
 *
 * Owns the Workspace entity — the root container for all WorkLedger data.
 *
 * @see 02_domain_model.md (Workspace)
 * @see 03_data_schema.md (Workspace Schema)
 */

export type { Workspace } from './entity';
export type { CreateWorkspaceInput, UpdateWorkspaceInput } from './types';
export {
  validateWorkspace,
  validateCreateWorkspaceInput,
} from './validation';
export type { IWorkspaceRepository } from './repository';
