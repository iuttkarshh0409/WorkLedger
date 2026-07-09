import { query } from '../db.js';
import { Activity, ActivityType } from '../types/domain.js';

export class ActivityCommandRepository {
  async create(a: Activity): Promise<void> {
    await query(
      `INSERT INTO activities (id, created_at, workspace_id, assignment_id, contributor_id, review_id, submission_id, type, performed_by, timestamp, request_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        a.id,
        a.createdAt,
        a.workspaceId,
        a.assignmentId,
        a.contributorId,
        a.reviewId,
        a.submissionId,
        a.type,
        a.performedBy,
        a.timestamp,
        a.requestId,
        a.metadata,
      ]
    );
  }
}

export class ActivityQueryRepository {
  async findByWorkspace(
    workspaceId: string,
    filters: {
      type?: ActivityType;
      performedBy?: string;
    } = {},
    pagination: {
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ items: Activity[]; totalCount: number }> {
    let sql = `SELECT * FROM activities WHERE workspace_id = $1`;
    const params: any[] = [workspaceId];

    let paramIdx = 2;
    if (filters.type) {
      sql += ` AND type = $${paramIdx++}`;
      params.push(filters.type);
    }
    if (filters.performedBy) {
      sql += ` AND performed_by = $${paramIdx++}`;
      params.push(filters.performedBy);
    }

    sql += ` ORDER BY timestamp DESC, created_at DESC`;

    const limit = pagination.limit || 50;
    const page = pagination.page || 1;
    const offset = (page - 1) * limit;

    let countSql = `SELECT COUNT(*) FROM activities WHERE workspace_id = $1`;
    const countParams: any[] = [workspaceId];
    let countParamIdx = 2;
    if (filters.type) {
      countSql += ` AND type = $${countParamIdx++}`;
      countParams.push(filters.type);
    }
    if (filters.performedBy) {
      countSql += ` AND performed_by = $${countParamIdx++}`;
      countParams.push(filters.performedBy);
    }

    sql += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, offset);

    const [res, countRes] = await Promise.all([
      query(sql, params),
      query(countSql, countParams)
    ]);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    const items = res.rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      workspaceId: row.workspace_id,
      assignmentId: row.assignment_id,
      contributorId: row.contributor_id,
      reviewId: row.review_id,
      submissionId: row.submission_id,
      type: row.type as ActivityType,
      performedBy: row.performed_by,
      timestamp: row.timestamp.toISOString(),
      requestId: row.request_id,
      metadata: row.metadata || {},
    }));

    return { items, totalCount };
  }
}
