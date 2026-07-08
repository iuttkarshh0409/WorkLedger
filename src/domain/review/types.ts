/**
 * Review Types
 *
 * Supporting types specific to the Review domain module.
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { ReviewScores } from './entity';

/**
 * CreateReviewInput
 *
 * The data required to create a new Review.
 * `id`, `createdAt`, and `updatedAt` are assigned by the service layer.
 */
export interface CreateReviewInput {
  assignmentId: EntityId;
  submissionId: EntityId;
  reviewedBy: EntityId;
  reviewedOn: Timestamp;
  scores: ReviewScores;
  strengths?: string[];
  improvements?: string[];
  feedback?: string;
}

/**
 * UpdateReviewInput
 *
 * Partial update fields for a Review that has not yet been published.
 * Published Reviews are immutable.
 * `id`, `assignmentId`, `submissionId`, and `createdAt` are immutable.
 */
export interface UpdateReviewInput {
  scores?: ReviewScores;
  strengths?: string[];
  improvements?: string[];
  feedback?: string;
  updatedAt: Timestamp;
}
