/**
 * Milestone Entity
 *
 * A Milestone groups related Assignments into a meaningful phase of work.
 * It does not replace Assignments — it contextualises them.
 *
 * @see 02_domain_model.md (Milestone)
 * @see 03_data_schema.md (Milestone Schema)
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { MilestoneStatus } from '../shared/enums';

export interface Milestone {
  readonly id: EntityId;
  readonly createdAt: Timestamp;
  updatedAt: Timestamp;

  workspaceId: EntityId;
  title: string;
  description: string;
  startDate: Timestamp;
  deadline: Timestamp;
  status: MilestoneStatus;
}
