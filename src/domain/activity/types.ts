/**
 * Activity Types
 *
 * Supporting types specific to the Activity domain module.
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { ActivityType } from '../shared/enums';

/**
 * CreateActivityInput
 *
 * The data required to record a new Activity.
 * `id` and `createdAt` are assigned by the service layer.
 *
 * Activities are never updated — there is no UpdateActivityInput.
 */
export interface CreateActivityInput {
  workspaceId: EntityId;
  assignmentId?: EntityId | null;
  contributorId?: EntityId | null;
  type: ActivityType;
  performedBy: EntityId;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
}
