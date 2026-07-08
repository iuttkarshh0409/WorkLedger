/**
 * Workspace Types
 *
 * Supporting types specific to the Workspace domain module.
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { WorkspaceStatus } from '../shared/enums';

/**
 * CreateWorkspaceInput
 *
 * The data required to create a new Workspace.
 * `id`, `createdAt`, and `updatedAt` are assigned by the service layer.
 */
export interface CreateWorkspaceInput {
  name: string;
  description: string;
  ownerId: EntityId;
  status?: WorkspaceStatus;
}

/**
 * UpdateWorkspaceInput
 *
 * Partial update fields for an existing Workspace.
 * `id` and `createdAt` are immutable after creation.
 */
export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  status?: WorkspaceStatus;
  updatedAt: Timestamp;
}
