/**
 * Submission Types
 *
 * Supporting types specific to the Submission domain module.
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { Attachment } from './entity';

/**
 * CreateSubmissionInput
 *
 * The data required to create a new Submission.
 * `id`, `createdAt`, and `updatedAt` are assigned by the service layer.
 */
export interface CreateSubmissionInput {
  assignmentId: EntityId;
  submittedOn: Timestamp;
  description?: string;
  attachments?: Attachment[];
  githubRepository?: string;
  pullRequest?: string;
  demoLink?: string;
  notes?: string;
}

/**
 * UpdateSubmissionInput
 *
 * Partial update fields for a Submission prior to review.
 * Once a Submission enters review it becomes immutable.
 * `id`, `assignmentId`, and `createdAt` are immutable after creation.
 */
export interface UpdateSubmissionInput {
  description?: string;
  attachments?: Attachment[];
  githubRepository?: string;
  pullRequest?: string;
  demoLink?: string;
  notes?: string;
  updatedAt: Timestamp;
}
