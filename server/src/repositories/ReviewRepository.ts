import { query } from '../db.js';
import { Review } from '../types/domain.js';

export class ReviewCommandRepository {
  async create(r: Review): Promise<void> {
    await query(
      `INSERT INTO reviews (
        id, created_at, updated_at, assignment_id, submission_id, reviewed_by, reviewed_on,
        technical_quality, documentation, communication, ownership, problem_solving, timeliness,
        strengths, improvements, feedback
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        r.id,
        r.createdAt,
        r.updatedAt,
        r.assignmentId,
        r.submissionId,
        r.reviewedBy,
        r.reviewedOn,
        r.scores.technicalQuality,
        r.scores.documentation,
        r.scores.communication,
        r.scores.ownership,
        r.scores.problemSolving,
        r.scores.timeliness,
        r.strengths,
        r.improvements,
        r.feedback,
      ]
    );
  }
}

export class ReviewQueryRepository {
  async findById(id: string): Promise<Review | null> {
    const res = await query(
      `SELECT * FROM reviews WHERE id = $1 AND archived_at IS NULL`,
      [id]
    );
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
      archivedBy: row.archived_by,
      assignmentId: row.assignment_id,
      submissionId: row.submission_id,
      reviewedBy: row.reviewed_by,
      reviewedOn: row.reviewed_on.toISOString(),
      scores: {
        technicalQuality: row.technical_quality,
        documentation: row.documentation,
        communication: row.communication,
        ownership: row.ownership,
        problemSolving: row.problem_solving,
        timeliness: row.timeliness,
      },
      strengths: row.strengths || [],
      improvements: row.improvements || [],
      feedback: row.feedback,
    };
  }

  async findBySubmission(submissionId: string): Promise<Review | null> {
    const res = await query(
      `SELECT * FROM reviews WHERE submission_id = $1 AND archived_at IS NULL ORDER BY reviewed_on DESC LIMIT 1`,
      [submissionId]
    );
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: null,
      archivedBy: null,
      assignmentId: row.assignment_id,
      submissionId: row.submission_id,
      reviewedBy: row.reviewed_by,
      reviewedOn: row.reviewed_on.toISOString(),
      scores: {
        technicalQuality: row.technical_quality,
        documentation: row.documentation,
        communication: row.communication,
        ownership: row.ownership,
        problemSolving: row.problem_solving,
        timeliness: row.timeliness,
      },
      strengths: row.strengths || [],
      improvements: row.improvements || [],
      feedback: row.feedback,
    };
  }

  async findByAssignment(assignmentId: string): Promise<Review[]> {
    const res = await query(
      `SELECT * FROM reviews WHERE assignment_id = $1 AND archived_at IS NULL ORDER BY reviewed_on DESC`,
      [assignmentId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: null,
      archivedBy: null,
      assignmentId: row.assignment_id,
      submissionId: row.submission_id,
      reviewedBy: row.reviewed_by,
      reviewedOn: row.reviewed_on.toISOString(),
      scores: {
        technicalQuality: row.technical_quality,
        documentation: row.documentation,
        communication: row.communication,
        ownership: row.ownership,
        problemSolving: row.problem_solving,
        timeliness: row.timeliness,
      },
      strengths: row.strengths || [],
      improvements: row.improvements || [],
      feedback: row.feedback,
    }));
  }

  async findByReviewer(reviewerId: string): Promise<Review[]> {
    const res = await query(
      `SELECT * FROM reviews WHERE reviewed_by = $1 AND archived_at IS NULL ORDER BY reviewed_on DESC`,
      [reviewerId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: null,
      archivedBy: null,
      assignmentId: row.assignment_id,
      submissionId: row.submission_id,
      reviewedBy: row.reviewed_by,
      reviewedOn: row.reviewed_on.toISOString(),
      scores: {
        technicalQuality: row.technical_quality,
        documentation: row.documentation,
        communication: row.communication,
        ownership: row.ownership,
        problemSolving: row.problem_solving,
        timeliness: row.timeliness,
      },
      strengths: row.strengths || [],
      improvements: row.improvements || [],
      feedback: row.feedback,
    }));
  }
}

