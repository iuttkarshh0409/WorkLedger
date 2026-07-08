/**
 * Contributor Types
 *
 * Supporting types specific to the Contributor domain module.
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { ContributorRole, ContributorStatus } from '../shared/enums';

/**
 * CreateContributorInput
 *
 * The data required to add a new Contributor to a Workspace.
 * `id`, `createdAt`, and `updatedAt` are assigned by the service layer.
 */
export interface CreateContributorInput {
  workspaceId: EntityId;
  name: string;
  email: string;
  avatar?: string;
  role: ContributorRole;
  joinedAt?: Timestamp;
  status?: ContributorStatus;
}

/**
 * UpdateContributorInput
 *
 * Partial update fields for an existing Contributor.
 * `id`, `workspaceId`, and `createdAt` are immutable after creation.
 */
export interface UpdateContributorInput {
  name?: string;
  email?: string;
  avatar?: string;
  role?: ContributorRole;
  status?: ContributorStatus;
  updatedAt: Timestamp;
}
