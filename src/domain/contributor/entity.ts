/**
 * Contributor Entity
 *
 * A Contributor is any individual who performs or manages work inside
 * a Workspace. The entity is intentionally role-neutral — the role field
 * determines their permissions, not their identity.
 *
 * @see 02_domain_model.md (Contributor)
 * @see 03_data_schema.md (Contributor Schema)
 * @see 04.5_permission_model.md (Core Roles)
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { ContributorStatus, ContributorRole } from '../shared/enums';

export interface Contributor {
  readonly id: EntityId;
  readonly createdAt: Timestamp;
  updatedAt: Timestamp;

  workspaceId: EntityId;
  name: string;
  email: string;
  avatar: string;
  role: ContributorRole;
  joinedAt: Timestamp;
  status: ContributorStatus;
}
