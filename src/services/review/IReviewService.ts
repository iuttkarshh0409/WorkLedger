/**
 * IReviewService
 *
 * Application-facing contract for Review operations.
 *
 * Each method corresponds to a documented Review workflow step.
 * The overall score is derived on publish — it is never stored.
 *
 * Responsibilities:
 * - Enforce Review workflow rules
 * - Derive overall score from individual category scores on publish
 * - Transition Assignment status upon Review publication
 * - Generate Activity records for all Review events
 * - Enforce permission rules per operation
 *
 * Rules:
 * - No repository types, storage types, or infrastructure imports
 * - Published Reviews are immutable — only Owners may correct them
 * - The overall score is calculated by this service, not stored on the entity
 * - Every meaningful operation generates an Activity
 *
 * @see docs/05_scoring_engine.md (Score calculation)
 * @see docs/04_assignment_lifecycle.md (Under Review, Revision Requested, Completed)
 * @see docs/04.5_permission_model.md (Review permissions)
 */

import type {
  Review,
  CreateReviewInput,
  UpdateReviewInput,
  AnyDomainError,
  EntityId,
} from '@domain';

export interface IReviewService {
  // ─── Write operations ───────────────────────────────────────────────────────

  /**
   * Publishes a completed Review for the given Submission.
   *
   * This operation:
   * - Validates all six category scores are present and in range
   * - Derives the overall score (not stored on the entity)
   * - Transitions Assignment status to Completed
   * - Records a ReviewPublished Activity
   * - Records an AssignmentCompleted Activity
   *
   * @permission Owner, Reviewer (assigned Reviewer only)
   * @see docs/05_scoring_engine.md
   * @see docs/04_assignment_lifecycle.md (Completed)
   * @see docs/04.5_permission_model.md (Publish Review)
   */
  publishReview(
    input: CreateReviewInput,
    performedBy: EntityId,
  ): Promise<Review | AnyDomainError>;

  /**
   * Requests a revision on the current Submission.
   *
   * This operation:
   * - Transitions Assignment status to Revision Requested
   * - Increments the Assignment's revisionCount
   * - Records a RevisionRequested Activity
   *
   * @permission Owner, Reviewer (assigned Reviewer only)
   * @see docs/04_assignment_lifecycle.md (Revision Requested)
   * @see docs/04.5_permission_model.md (Request Revision)
   */
  requestRevision(
    assignmentId: EntityId,
    submissionId: EntityId,
    feedback: string,
    performedBy: EntityId,
  ): Promise<Review | AnyDomainError>;

  /**
   * Updates an unpublished Review draft.
   * Not permitted after the Review has been published.
   *
   * @permission Owner, Reviewer (assigned Reviewer only)
   */
  updateReview(
    id: EntityId,
    input: UpdateReviewInput,
    performedBy: EntityId,
  ): Promise<Review | AnyDomainError>;

  /**
   * Applies an administrative correction to a published Review.
   *
   * This operation:
   * - Requires Workspace Owner privileges
   * - Records an Activity with previous and updated values
   * - Preserves the original Review in the Activity record
   *
   * Administrative corrections should be rare and fully auditable.
   *
   * @permission Owner only
   * @see docs/04.5_permission_model.md (Administrative Corrections)
   */
  correctReview(
    id: EntityId,
    input: UpdateReviewInput,
    reason: string,
    performedBy: EntityId,
  ): Promise<Review | AnyDomainError>;

  // ─── Read operations ────────────────────────────────────────────────────────

  /**
   * Returns the Review with the given id, or null if not found.
   */
  getReviewById(
    id: EntityId,
  ): Promise<Review | null | AnyDomainError>;

  /**
   * Returns all Reviews for the given Assignment.
   */
  getReviewsByAssignment(
    assignmentId: EntityId,
  ): Promise<Review[] | AnyDomainError>;

  /**
   * Returns the Review for the given Submission, or null if none exists.
   */
  getReviewBySubmission(
    submissionId: EntityId,
  ): Promise<Review | null | AnyDomainError>;

  /**
   * Returns all Reviews published by the given Reviewer.
   */
  getReviewsByReviewer(
    reviewerId: EntityId,
  ): Promise<Review[] | AnyDomainError>;
}
