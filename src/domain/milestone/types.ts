/**
 * Milestone Types
 *
 * Supporting types specific to the Milestone domain module.
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { MilestoneStatus } from '../shared/enums';

/**
 * CreateMilestoneInput
 *
 * The data required to create a new Milestone.
 * `id`, `createdAt`, and `updatedAt` are assigned by the service layer.
 */
export interface CreateMilestoneInput {
  workspaceId: EntityId;
  title: string;
  description?: string;
  startDate: Timestamp;
  deadline: Timestamp;
  status?: MilestoneStatus;
}

/**
 * UpdateMilestoneInput
 *
 * Partial update fields for an existing Milestone.
 * `id`, `workspaceId`, and `createdAt` are immutable after creation.
 */
export interface UpdateMilestoneInput {
  title?: string;
  description?: string;
  startDate?: Timestamp;
  deadline?: Timestamp;
  status?: MilestoneStatus;
  updatedAt: Timestamp;
}
