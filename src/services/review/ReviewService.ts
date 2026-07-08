/**
 * ReviewService
 *
 * Implements IReviewService.
 * Manages the Review lifecycle and derives scores on publication.
 *
 * Responsibilities:
 * - Publish Reviews (deriving overall score — never storing it)
 * - Request revisions (transitioning Assignment + incrementing revisionCount)
 * - Apply administrative corrections to published Reviews
 * - Provide read access to Review history
 * - Record Activity events on every meaningful operation
 *
 * Not responsible for:
 * - Submission management (SubmissionService)
 * - Persisting the overall score
 * - Storage mechanics
 *
 * Authorization note:
 * - `performedBy` is accepted and stored as-is.
 * - Role enforcement (Reviewer-only for publish/revision, Owner-only for correct)
 *   will be introduced when identity management lands.
 *
 * Pipeline: Validate → Read → Business Rule → Persist → Record Activity → Return
 *
 * @see src/services/review/IReviewService.ts
 * @see docs/05_scoring_engine.md (Score derivation)
 * @see docs/04_assignment_lifecycle.md (Under Review, Revision Requested, Completed)
 * @see docs/04.5_permission_model.md (Review permissions)
 */

import type { IReviewService } from './IReviewService';
import type {
  IReviewRepository,
  IAssignmentRepository,
  IContributorRepository,
  Review,
  CreateReviewInput,
  UpdateReviewInput,
  AnyDomainError,
  EntityId,
} from '@domain';
import {
  validateReview,
  validateCreateReviewInput,
  validateReviewScores,
  AssignmentStatus,
  ActivityType,
  Authorization,
} from '@domain';
import type { IActivityService } from '../activity/IActivityService';
import { generateId } from '@lib';
import { calculateOverallScore } from '@lib/scoring';
import { isDomainError, validationError, notFound, conflict, permissionDenied } from '@lib/errors';

export class ReviewService implements IReviewService {
  constructor(
    private readonly reviews: IReviewRepository,
    private readonly assignments: IAssignmentRepository,
    private readonly activityService: IActivityService,
    private readonly contributors?: IContributorRepository,
  ) {}

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async fetchReview(id: EntityId): Promise<Review | AnyDomainError> {
    const result = await this.reviews.findById(id);
    if (isDomainError(result)) return result;
    if (result === null) return notFound('Review', id);
    return result;
  }

  private async fetchAssignment(id: EntityId) {
    const result = await this.assignments.findById(id);
    if (isDomainError(result)) return result;
    if (result === null) return notFound('Assignment', id);
    return result;
  }

  /**
   * Transitions Assignment to targetStatus after a Review operation.
   * Returns the updated Assignment or an error.
   */
  private async transitionAssignment(
    assignmentId: EntityId,
    targetStatus: AssignmentStatus,
    extraFields: Partial<{ revisionCount: number }> = {},
    updatedAtOverride?: string,
  ) {
    const assignment = await this.fetchAssignment(assignmentId);
    if (isDomainError(assignment)) return assignment;

    const now = new Date().toISOString();
    const updated = { ...assignment, status: targetStatus, updatedAt: updatedAtOverride ?? now, ...extraFields };
    return this.assignments.update(updated);
  }

  // ─── Write operations ───────────────────────────────────────────────────────

  async publishReview(
    input: CreateReviewInput,
    performedBy: EntityId,
  ): Promise<Review | AnyDomainError> {
    // Validate input
    const inputValidation = validateCreateReviewInput(input);
    if (!inputValidation.valid) {
      return validationError('ReviewService.publishReview', inputValidation.errors);
    }

    // Validate scores explicitly (required on publish — all categories must be present)
    const scoresValidation = validateReviewScores(input.scores);
    if (!scoresValidation.valid) {
      return validationError('ReviewService.publishReview', scoresValidation.errors);
    }

    // Assignment must be Under Review or Submitted to accept a review
    const assignment = await this.fetchAssignment(input.assignmentId);
    if (isDomainError(assignment)) return assignment;

    if (this.contributors) {
      const actor = await this.contributors.findById(performedBy);
      if (isDomainError(actor)) return actor;
      if (actor === null) return notFound('Contributor', performedBy);
      if (!Authorization.canPublishReview(actor.role, performedBy, assignment)) {
        return permissionDenied('ReviewService.publishReview', `User ${performedBy} is not authorized to review this assignment.`);
      }
    }

    if (
      assignment.status !== AssignmentStatus.UnderReview &&
      assignment.status !== AssignmentStatus.Submitted
    ) {
      return conflict(
        `Assignment "${assignment.id}" must be Submitted or Under Review to publish a review. ` +
        `Current status: "${assignment.status}".`,
      );
    }

    // No existing review for this submission
    const existing = await this.reviews.findBySubmission(input.submissionId);
    if (isDomainError(existing)) return existing;
    if (existing !== null) {
      return conflict(
        `A Review already exists for Submission "${input.submissionId}".`,
      );
    }

    // Derive overall score — never stored on the entity
    const _overallScore = calculateOverallScore(input.scores);

    const now = new Date().toISOString();
    const isHist = !!input.isHistorical;
    const review: Review = {
      id:           generateId(),
      createdAt:    isHist ? input.reviewedOn : now,
      updatedAt:    isHist ? input.reviewedOn : now,
      assignmentId: input.assignmentId,
      submissionId: input.submissionId,
      reviewedBy:   input.reviewedBy,
      reviewedOn:   input.reviewedOn,
      scores:       input.scores,
      strengths:    input.strengths   ?? [],
      improvements: input.improvements ?? [],
      feedback:     input.feedback    ?? '',
    };

    const entityValidation = validateReview(review);
    if (!entityValidation.valid) {
      return validationError('ReviewService.publishReview', entityValidation.errors);
    }

    const saved = await this.reviews.create(review);
    if (isDomainError(saved)) return saved;

    // Transition Assignment to Completed after successful Review save
    const transitioned = await this.transitionAssignment(
      input.assignmentId,
      AssignmentStatus.Completed,
      {},
      isHist ? input.reviewedOn : undefined,
    );
    if (isDomainError(transitioned)) return transitioned;

    // Record ReviewPublished Activity
    await this.activityService.recordActivity({
      workspaceId:   assignment.workspaceId,
      performedBy,
      type:          ActivityType.ReviewPublished,
      timestamp:     isHist ? input.reviewedOn : now,
      assignmentId:  assignment.id,
      contributorId: assignment.contributorId,
      metadata: {
        reviewId:     saved.id,
        submissionId: saved.submissionId,
        overallScore: _overallScore.value,
        ...(isHist ? { isHistorical: true, enteredOn: input.enteredOn || now.split('T')[0] } : {})
      },
    });

    // Record AssignmentCompleted Activity
    await this.activityService.recordActivity({
      workspaceId:   assignment.workspaceId,
      performedBy,
      type:          ActivityType.AssignmentCompleted,
      timestamp:     isHist ? input.reviewedOn : now,
      assignmentId:  assignment.id,
      contributorId: assignment.contributorId,
      metadata:      {
        reviewId: saved.id,
        ...(isHist ? { isHistorical: true, enteredOn: input.enteredOn || now.split('T')[0] } : {})
      },
    });

    return saved;
  }

  async requestRevision(
    assignmentId: EntityId,
    submissionId: EntityId,
    feedback: string,
    performedBy: EntityId,
    reviewedOn?: string,
    isHistorical?: boolean,
    enteredOn?: string,
  ): Promise<Review | AnyDomainError> {
    // @permission Owner, Reviewer (assigned Reviewer only)
    const assignment = await this.fetchAssignment(assignmentId);
    if (isDomainError(assignment)) return assignment;

    if (this.contributors) {
      const actor = await this.contributors.findById(performedBy);
      if (isDomainError(actor)) return actor;
      if (actor === null) return notFound('Contributor', performedBy);
      if (!Authorization.canRequestRevision(actor.role, performedBy, assignment)) {
        return permissionDenied('ReviewService.requestRevision', `User ${performedBy} is not authorized to request revisions for this assignment.`);
      }
    }

    if (
      assignment.status !== AssignmentStatus.UnderReview &&
      assignment.status !== AssignmentStatus.Submitted
    ) {
      return conflict(
        `Assignment "${assignment.id}" must be Submitted or Under Review to request a revision. ` +
        `Current status: "${assignment.status}".`,
      );
    }

    const now = new Date().toISOString();
    const isHist = !!isHistorical;
    const targetDate = isHist && reviewedOn ? reviewedOn : now;

    // Transition Assignment to RevisionRequested and increment revisionCount
    const transitioned = await this.transitionAssignment(
      assignmentId,
      AssignmentStatus.RevisionRequested,
      { revisionCount: assignment.revisionCount + 1 },
      targetDate,
    );
    if (isDomainError(transitioned)) return transitioned;

    // Create a partial Review record to document the revision request
    const review: Review = {
      id:           generateId(),
      createdAt:    targetDate,
      updatedAt:    targetDate,
      assignmentId,
      submissionId,
      reviewedBy:   performedBy,
      reviewedOn:   targetDate,
      scores: {
        technicalQuality: 0,
        documentation:    0,
        communication:    0,
        ownership:        0,
        problemSolving:   0,
        timeliness:       0,
      },
      strengths:    [],
      improvements: [],
      feedback,
    };

    const saved = await this.reviews.create(review);
    if (isDomainError(saved)) return saved;

    await this.activityService.recordActivity({
      workspaceId:   assignment.workspaceId,
      performedBy,
      type:          ActivityType.RevisionRequested,
      timestamp:     targetDate,
      assignmentId,
      contributorId: assignment.contributorId,
      metadata: {
        reviewId:      saved.id,
        submissionId,
        revisionCount: transitioned.revisionCount,
        feedback,
        ...(isHist ? { isHistorical: true, enteredOn: enteredOn || now.split('T')[0] } : {})
      },
    });

    return saved;
  }

  async updateReview(
    id: EntityId,
    input: UpdateReviewInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _performedBy: EntityId,
  ): Promise<Review | AnyDomainError> {
    const existing = await this.fetchReview(id);
    if (isDomainError(existing)) return existing;

    const assignment = await this.fetchAssignment(existing.assignmentId);
    if (isDomainError(assignment)) return assignment;

    // Cannot update after Assignment is Completed
    if (assignment.status === AssignmentStatus.Completed) {
      return conflict(
        `Review "${id}" cannot be updated because its Assignment is already Completed. ` +
        `Use correctReview() for administrative corrections.`,
      );
    }

    const now = new Date().toISOString();
    const updated: Review = {
      ...existing,
      scores:       input.scores       ?? existing.scores,
      strengths:    input.strengths    ?? existing.strengths,
      improvements: input.improvements ?? existing.improvements,
      feedback:     input.feedback     ?? existing.feedback,
      updatedAt:    now,
    };

    return this.reviews.update(updated);
  }

  async correctReview(
    id: EntityId,
    input: UpdateReviewInput,
    reason: string,
    performedBy: EntityId,
  ): Promise<Review | AnyDomainError> {
    // @permission Owner only
    if (this.contributors) {
      const actor = await this.contributors.findById(performedBy);
      if (isDomainError(actor)) return actor;
      if (actor === null) return notFound('Contributor', performedBy);
      if (!Authorization.canArchiveContributor(actor.role)) {
        return permissionDenied('ReviewService.correctReview', `Role "${actor.role}" is not authorized.`);
      }
    }

    const existing = await this.fetchReview(id);
    if (isDomainError(existing)) return existing;

    const assignment = await this.fetchAssignment(existing.assignmentId);
    if (isDomainError(assignment)) return assignment;

    const now = new Date().toISOString();
    const corrected: Review = {
      ...existing,
      scores:       input.scores       ?? existing.scores,
      strengths:    input.strengths    ?? existing.strengths,
      improvements: input.improvements ?? existing.improvements,
      feedback:     input.feedback     ?? existing.feedback,
      updatedAt:    now,
    };

    const saved = await this.reviews.update(corrected);
    if (isDomainError(saved)) return saved;

    // Preserve original scores in the Activity for full audit trail
    await this.activityService.recordActivity({
      workspaceId:   assignment.workspaceId,
      performedBy,
      type:          ActivityType.ReviewCorrected,
      timestamp:     now,
      assignmentId:  existing.assignmentId,
      contributorId: assignment.contributorId,
      metadata: {
        reviewId:       id,
        reason,
        previousScores: existing.scores,
        updatedScores:  saved.scores,
      },
    });

    return saved;
  }

  // ─── Read operations ────────────────────────────────────────────────────────

  async getReviewById(
    id: EntityId,
  ): Promise<Review | null | AnyDomainError> {
    return this.reviews.findById(id);
  }

  async getReviewsByAssignment(
    assignmentId: EntityId,
  ): Promise<Review[] | AnyDomainError> {
    return this.reviews.findByAssignment(assignmentId);
  }

  async getReviewBySubmission(
    submissionId: EntityId,
  ): Promise<Review | null | AnyDomainError> {
    return this.reviews.findBySubmission(submissionId);
  }

  async getReviewsByReviewer(
    reviewerId: EntityId,
  ): Promise<Review[] | AnyDomainError> {
    return this.reviews.findByReviewer(reviewerId);
  }
}
