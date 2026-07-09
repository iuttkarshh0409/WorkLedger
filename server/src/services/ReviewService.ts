import { ReviewQueryRepository } from '../repositories/ReviewRepository.js';
import { AssignmentQueryRepository } from '../repositories/AssignmentRepository.js';
import { Review, AssignmentStatus, ReviewScores } from '../types/domain.js';
import { transaction } from '../db.js';
import { randomUUID } from 'crypto';

export class ReviewService {
  constructor(
    private readonly reviewQuery: ReviewQueryRepository,
    private readonly assignmentQuery: AssignmentQueryRepository
  ) {}

  async publishReview(
    input: {
      assignmentId: string;
      submissionId: string;
      reviewedBy: string;
      reviewedOn: string;
      scores: ReviewScores;
      strengths?: string[];
      improvements?: string[];
      feedback?: string;
      isHistorical?: boolean;
      enteredOn?: string;
    },
    performedBy: string,
    requestId: string
  ): Promise<Review> {
    const assignment = await this.assignmentQuery.findById(input.assignmentId);
    if (!assignment) {
      throw { status: 404, code: 'NOT_FOUND', message: `Assignment with id ${input.assignmentId} not found.` };
    }

    if (
      assignment.status !== AssignmentStatus.Submitted &&
      assignment.status !== AssignmentStatus.UnderReview
    ) {
      throw {
        status: 400,
        code: 'INVALID_ASSIGNMENT_STATUS',
        message: `Assignment must be Submitted or Under Review to publish a review. Current status: ${assignment.status}`,
      };
    }

    const existing = await this.reviewQuery.findBySubmission(input.submissionId);
    if (existing) {
      throw { status: 400, code: 'DUPLICATE_REVIEW', message: `A review already exists for submission ${input.submissionId}` };
    }

    const now = new Date().toISOString();
    const isHist = !!input.isHistorical;
    const reviewId = randomUUID();
    const reviewPublishedActId = randomUUID();
    const assignmentCompletedActId = randomUUID();

    const review: Review = {
      id: reviewId,
      createdAt: isHist && input.reviewedOn ? input.reviewedOn : now,
      updatedAt: isHist && input.reviewedOn ? input.reviewedOn : now,
      archivedAt: null,
      archivedBy: null,
      assignmentId: input.assignmentId,
      submissionId: input.submissionId,
      reviewedBy: input.reviewedBy,
      reviewedOn: input.reviewedOn,
      scores: input.scores,
      strengths: input.strengths || [],
      improvements: input.improvements || [],
      feedback: input.feedback || '',
    };

    // Calculate average score dynamically for metadata
    const scores = review.scores;
    const avgScore = (
      scores.technicalQuality +
      scores.documentation +
      scores.communication +
      scores.ownership +
      scores.problemSolving +
      scores.timeliness
    ) / 6;

    await transaction(async (client) => {
      // 1. Create Review
      await client.query(
        `INSERT INTO reviews (
          id, created_at, updated_at, assignment_id, submission_id, reviewed_by, reviewed_on,
          technical_quality, documentation, communication, ownership, problem_solving, timeliness,
          strengths, improvements, feedback
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          review.id,
          review.createdAt,
          review.updatedAt,
          review.assignmentId,
          review.submissionId,
          review.reviewedBy,
          review.reviewedOn,
          review.scores.technicalQuality,
          review.scores.documentation,
          review.scores.communication,
          review.scores.ownership,
          review.scores.problemSolving,
          review.scores.timeliness,
          review.strengths,
          review.improvements,
          review.feedback,
        ]
      );

      // 2. Transition Assignment to Completed (and OCC check)
      const res = await client.query(
        `UPDATE assignments
         SET status = $1, version = version + 1, updated_at = NOW()
         WHERE id = $2 AND version = $3 AND archived_at IS NULL`,
        [AssignmentStatus.Completed, assignment.id, assignment.version]
      );

      if (res.rowCount === 0) {
        throw { status: 409, code: 'RESOURCE_CONFLICT', message: 'Assignment was modified by another transaction.' };
      }

      const timestamp = isHist && input.reviewedOn ? input.reviewedOn : now;

      // 3. Record ReviewPublished Activity
      await client.query(
        `INSERT INTO activities (id, created_at, workspace_id, assignment_id, contributor_id, review_id, submission_id, type, performed_by, timestamp, request_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          reviewPublishedActId,
          now,
          assignment.workspaceId,
          assignment.id,
          assignment.contributorId,
          review.id,
          review.submissionId,
          'Review Published',
          performedBy,
          timestamp,
          requestId,
          JSON.stringify({
            reviewId: review.id,
            submissionId: review.submissionId,
            overallScore: parseFloat(avgScore.toFixed(2)),
            ...(isHist ? { isHistorical: true, enteredOn: input.enteredOn || now } : {}),
          }),
        ]
      );

      // 4. Record AssignmentCompleted Activity
      await client.query(
        `INSERT INTO activities (id, created_at, workspace_id, assignment_id, contributor_id, review_id, submission_id, type, performed_by, timestamp, request_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          assignmentCompletedActId,
          now,
          assignment.workspaceId,
          assignment.id,
          assignment.contributorId,
          review.id,
          null,
          'Assignment Completed',
          performedBy,
          timestamp,
          requestId,
          JSON.stringify({
            reviewId: review.id,
            ...(isHist ? { isHistorical: true, enteredOn: input.enteredOn || now } : {}),
          }),
        ]
      );
    });

    return review;
  }

  async requestRevision(
    input: {
      assignmentId: string;
      submissionId: string;
      feedback: string;
      reviewedOn?: string;
      isHistorical?: boolean;
      enteredOn?: string;
    },
    performedBy: string,
    requestId: string
  ): Promise<Review> {
    const assignment = await this.assignmentQuery.findById(input.assignmentId);
    if (!assignment) {
      throw { status: 404, code: 'NOT_FOUND', message: `Assignment with id ${input.assignmentId} not found.` };
    }

    if (
      assignment.status !== AssignmentStatus.Submitted &&
      assignment.status !== AssignmentStatus.UnderReview
    ) {
      throw {
        status: 400,
        code: 'INVALID_ASSIGNMENT_STATUS',
        message: `Assignment must be Submitted or Under Review to request revision. Current status: ${assignment.status}`,
      };
    }

    const now = new Date().toISOString();
    const isHist = !!input.isHistorical;
    const targetDate = isHist && input.reviewedOn ? input.reviewedOn : now;

    const reviewId = randomUUID();
    const activityId = randomUUID();

    const review: Review = {
      id: reviewId,
      createdAt: targetDate,
      updatedAt: targetDate,
      archivedAt: null,
      archivedBy: null,
      assignmentId: input.assignmentId,
      submissionId: input.submissionId,
      reviewedBy: performedBy,
      reviewedOn: targetDate,
      scores: {
        technicalQuality: 0,
        documentation: 0,
        communication: 0,
        ownership: 0,
        problemSolving: 0,
        timeliness: 0,
      },
      strengths: [],
      improvements: [],
      feedback: input.feedback,
    };

    await transaction(async (client) => {
      // 1. Insert stub review
      await client.query(
        `INSERT INTO reviews (
          id, created_at, updated_at, assignment_id, submission_id, reviewed_by, reviewed_on,
          technical_quality, documentation, communication, ownership, problem_solving, timeliness,
          strengths, improvements, feedback
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          review.id,
          review.createdAt,
          review.updatedAt,
          review.assignmentId,
          review.submissionId,
          review.reviewedBy,
          review.reviewedOn,
          0, 0, 0, 0, 0, 0,
          review.strengths,
          review.improvements,
          review.feedback,
        ]
      );

      // 2. Transition Assignment (and OCC check)
      const res = await client.query(
        `UPDATE assignments
         SET status = $1, revision_count = revision_count + 1, version = version + 1, updated_at = NOW()
         WHERE id = $2 AND version = $3 AND archived_at IS NULL`,
        [AssignmentStatus.RevisionRequested, assignment.id, assignment.version]
      );

      if (res.rowCount === 0) {
        throw { status: 409, code: 'RESOURCE_CONFLICT', message: 'Assignment was modified by another transaction.' };
      }

      // 3. Record RevisionRequested Activity
      await client.query(
        `INSERT INTO activities (id, created_at, workspace_id, assignment_id, contributor_id, review_id, submission_id, type, performed_by, timestamp, request_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          activityId,
          now,
          assignment.workspaceId,
          assignment.id,
          assignment.contributorId,
          review.id,
          review.submissionId,
          'Revision Requested',
          performedBy,
          targetDate,
          requestId,
          JSON.stringify({
            reviewId: review.id,
            submissionId: review.submissionId,
            revisionCount: assignment.revisionCount + 1,
            feedback: review.feedback,
            ...(isHist ? { isHistorical: true, enteredOn: input.enteredOn || now } : {}),
          }),
        ]
      );
    });

    return review;
  }

  async getReviewById(id: string): Promise<Review> {
    const r = await this.reviewQuery.findById(id);
    if (!r) {
      throw { status: 404, code: 'NOT_FOUND', message: `Review with id ${id} not found.` };
    }
    return r;
  }

  async getReviewBySubmission(submissionId: string): Promise<Review | null> {
    return this.reviewQuery.findBySubmission(submissionId);
  }

  async getReviewsByAssignment(assignmentId: string): Promise<Review[]> {
    return this.reviewQuery.findByAssignment(assignmentId);
  }
}
