/**
 * Workspace Entity
 *
 * A Workspace represents an independent environment where Contributors
 * collaborate. It is the root owner of every other entity.
 *
 * @see 02_domain_model.md (Workspace)
 * @see 03_data_schema.md (Workspace Schema)
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { WorkspaceStatus } from '../shared/enums';

export interface Workspace {
  readonly id: EntityId;
  readonly createdAt: Timestamp;
  updatedAt: Timestamp;

  name: string;
  description: string;
  ownerId: EntityId;
  status: WorkspaceStatus;
}
