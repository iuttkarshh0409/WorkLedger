/**
 * Assignment Types
 *
 * Supporting types specific to the Assignment domain module.
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { AssignmentStatus, AssignmentPriority } from '../shared/enums';

/**
 * CreateAssignmentInput
 *
 * The data required to create a new Assignment.
 * `id`, `createdAt`, `updatedAt`, and `revisionCount` are
 * assigned by the service layer.
 */
export interface CreateAssignmentInput {
  workspaceId: EntityId;
  milestoneId?: EntityId | null;
  contributorId: EntityId;
  reviewerId: EntityId | null;
  title: string;
  description?: string;
  priority?: AssignmentPriority;
  tags?: string[];
  assignedOn: Timestamp;
  deadline: Timestamp;
  status?: AssignmentStatus;
}

/**
 * UpdateAssignmentInput
 *
 * Partial update fields for an existing Assignment.
 * `id`, `workspaceId`, and `createdAt` are immutable after creation.
 */
export interface UpdateAssignmentInput {
  milestoneId?: EntityId | null;
  contributorId?: EntityId;
  reviewerId?: EntityId | null;
  title?: string;
  description?: string;
  priority?: AssignmentPriority;
  tags?: string[];
  deadline?: Timestamp;
  status?: AssignmentStatus;
  revisionCount?: number;
  updatedAt: Timestamp;
}
