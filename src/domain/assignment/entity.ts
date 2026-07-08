/**
 * Assignment Entity
 *
 * An Assignment represents a unit of delegated work. Assignments are
 * immutable historical records — once created they always remain part
 * of the Ledger.
 *
 * Fields contain only factual source data.
 * Derived values (completion rate, average score, etc.) belong
 * to Analytics and Contributor engines.
 *
 * @see 02_domain_model.md (Assignment)
 * @see 03_data_schema.md (Assignment Schema)
 * @see 04_assignment_lifecycle.md (Lifecycle Overview)
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { AssignmentStatus, AssignmentPriority } from '../shared/enums';

export interface Assignment {
  readonly id: EntityId;
  readonly createdAt: Timestamp;
  updatedAt: Timestamp;

  workspaceId: EntityId;
  milestoneId: EntityId | null;
  contributorId: EntityId;
  reviewerId: EntityId | null;

  title: string;
  description: string;

  priority: AssignmentPriority;
  tags: string[];

  assignedOn: Timestamp;
  deadline: Timestamp;

  status: AssignmentStatus;

  /**
   * revisionCount
   *
   * Incremented by the system each time a Revision is Requested.
   * Never set manually — updated by the Assignment service.
   *
   * @see 04_assignment_lifecycle.md (Revision Requested)
   */
  revisionCount: number;
}
