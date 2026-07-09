import { query } from '../db.js';
import { Submission } from '../types/domain.js';

export class SubmissionCommandRepository {
  async create(s: Submission): Promise<void> {
    await query(
      `INSERT INTO submissions (id, created_at, updated_at, assignment_id, submitted_on, description, github_repository, pull_request, demo_link, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        s.id,
        s.createdAt,
        s.updatedAt,
        s.assignmentId,
        s.submittedOn,
        s.description,
        s.githubRepository,
        s.pullRequest,
        s.demoLink,
        s.notes,
      ]
    );
  }
}

export class SubmissionQueryRepository {
  async findById(id: string): Promise<Submission | null> {
    const res = await query(
      `SELECT * FROM submissions WHERE id = $1 AND archived_at IS NULL`,
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
      submittedOn: row.submitted_on.toISOString(),
      description: row.description,
      githubRepository: row.github_repository,
      pullRequest: row.pull_request,
      demoLink: row.demo_link,
      notes: row.notes,
    };
  }

  async findByAssignment(assignmentId: string): Promise<Submission[]> {
    const res = await query(
      `SELECT * FROM submissions WHERE assignment_id = $1 AND archived_at IS NULL ORDER BY submitted_on DESC`,
      [assignmentId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: null,
      archivedBy: null,
      assignmentId: row.assignment_id,
      submittedOn: row.submitted_on.toISOString(),
      description: row.description,
      githubRepository: row.github_repository,
      pullRequest: row.pull_request,
      demoLink: row.demo_link,
      notes: row.notes,
    }));
  }
}
