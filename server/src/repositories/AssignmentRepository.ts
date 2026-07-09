import { query } from '../db.js';
import { Assignment, AssignmentStatus, AssignmentPriority } from '../types/domain.js';

export class AssignmentCommandRepository {
  async create(a: Assignment): Promise<void> {
    await query(
      `INSERT INTO assignments (id, created_at, updated_at, workspace_id, milestone_id, contributor_id, reviewer_id, title, description, priority, tags, assigned_on, deadline, status, revision_count, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        a.id,
        a.createdAt,
        a.updatedAt,
        a.workspaceId,
        a.milestoneId,
        a.contributorId,
        a.reviewerId,
        a.title,
        a.description,
        a.priority,
        a.tags,
        a.assignedOn,
        a.deadline,
        a.status,
        a.revisionCount,
        a.version,
      ]
    );
  }

  async update(a: Assignment): Promise<void> {
    const res = await query(
      `UPDATE assignments
       SET milestone_id = $1, contributor_id = $2, reviewer_id = $3, title = $4, description = $5, priority = $6, tags = $7, assigned_on = $8, deadline = $9, status = $10, revision_count = $11, version = version + 1, updated_at = NOW()
       WHERE id = $12 AND version = $13 AND archived_at IS NULL`,
      [
        a.milestoneId,
        a.contributorId,
        a.reviewerId,
        a.title,
        a.description,
        a.priority,
        a.tags,
        a.assignedOn,
        a.deadline,
        a.status,
        a.revisionCount,
        a.id,
        a.version,
      ]
    );
    if (res.rowCount === 0) {
      throw {
        status: 409,
        code: 'RESOURCE_CONFLICT',
        message: 'Assignment was modified by another transaction or has been archived.',
      };
    }
  }

  async updatePartial(
    id: string,
    fields: Partial<Assignment>,
    version: number
  ): Promise<{ updated: Assignment; old: { status: string; deadline: string; workspaceId: string; contributorId: string; title: string } }> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    params.push(id);
    const idIdx = paramIdx++;

    const ignoredFields = ['id', 'createdAt', 'created_at', 'updatedAt', 'updated_at', 'version'];
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      if (ignoredFields.includes(key)) continue;
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      updates.push(`${snakeKey} = $${paramIdx++}`);
      params.push(value);
    }

    params.push(version);
    const versionIdx = paramIdx++;

    const queryStr = `
      WITH old_assignment AS (
        SELECT status, deadline, workspace_id, contributor_id, title FROM assignments WHERE id = $${idIdx}
      ),
      updated_assignment AS (
        UPDATE assignments
        SET ${updates.join(', ')}, version = version + 1, updated_at = NOW()
        WHERE id = $${idIdx} AND version = $${versionIdx} AND archived_at IS NULL
        RETURNING *
      )
      SELECT u.*, 
             o.status AS old_status, 
             o.deadline AS old_deadline,
             o.workspace_id AS old_workspace_id,
             o.contributor_id AS old_contributor_id,
             o.title AS old_title
      FROM updated_assignment u
      CROSS JOIN old_assignment o
    `;

    const res = await query(queryStr, params);
    if (res.rowCount === 0) {
      throw {
        status: 409,
        code: 'RESOURCE_CONFLICT',
        message: 'Assignment was modified by another transaction or has been archived.',
      };
    }
    const row = res.rows[0];
    const updated: Assignment = {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
      archivedBy: row.archived_by,
      workspaceId: row.workspace_id,
      milestoneId: row.milestone_id,
      contributorId: row.contributor_id,
      reviewerId: row.reviewer_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      tags: row.tags,
      assignedOn: row.assigned_on.toISOString(),
      deadline: row.deadline.toISOString(),
      status: row.status,
      revisionCount: row.revision_count,
      version: row.version,
    };
    return {
      updated,
      old: {
        status: row.old_status,
        deadline: row.old_deadline.toISOString(),
        workspaceId: row.old_workspace_id,
        contributorId: row.old_contributor_id,
        title: row.old_title,
      }
    };
  }

  async archive(id: string, performedBy: string): Promise<Assignment> {
    const res = await query(
      `UPDATE assignments
       SET archived_at = NOW(), archived_by = $1, status = 'Archived', version = version + 1, updated_at = NOW()
       WHERE id = $2 AND archived_at IS NULL
       RETURNING *`,
      [performedBy, id]
    );
    if (res.rowCount === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Assignment not found or already archived.',
      };
    }
    const row = res.rows[0];
    return {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at.toISOString(),
      archivedBy: row.archived_by,
      workspaceId: row.workspace_id,
      milestoneId: row.milestone_id,
      contributorId: row.contributor_id,
      reviewerId: row.reviewer_id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      tags: row.tags,
      assignedOn: row.assigned_on.toISOString(),
      deadline: row.deadline.toISOString(),
      status: row.status,
      revisionCount: row.revision_count,
      version: row.version,
    };
  }
}

export class AssignmentQueryRepository {
  async findById(id: string): Promise<Assignment | null> {
    const res = await query(
      `SELECT * FROM assignments WHERE id = $1 AND archived_at IS NULL`,
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
      workspaceId: row.workspace_id,
      milestoneId: row.milestone_id,
      contributorId: row.contributor_id,
      reviewerId: row.reviewer_id,
      title: row.title,
      description: row.description,
      priority: row.priority as AssignmentPriority,
      tags: row.tags || [],
      assignedOn: row.assigned_on.toISOString(),
      deadline: row.deadline.toISOString(),
      status: row.status as AssignmentStatus,
      revisionCount: row.revision_count,
      version: row.version,
    };
  }

  async findByWorkspace(
    workspaceId: string,
    filters: {
      milestoneId?: string;
      contributorId?: string;
      reviewerId?: string;
      status?: AssignmentStatus;
      priority?: AssignmentPriority;
    } = {},
    pagination: {
      page?: number;
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<{ items: Assignment[]; totalCount: number }> {
    let sql = `SELECT * FROM assignments WHERE workspace_id = $1 AND archived_at IS NULL`;
    const params: any[] = [workspaceId];

    let paramIdx = 2;
    if (filters.milestoneId) {
      sql += ` AND milestone_id = $${paramIdx++}`;
      params.push(filters.milestoneId);
    }
    if (filters.contributorId) {
      sql += ` AND contributor_id = $${paramIdx++}`;
      params.push(filters.contributorId);
    }
    if (filters.reviewerId) {
      sql += ` AND reviewer_id = $${paramIdx++}`;
      params.push(filters.reviewerId);
    }
    if (filters.status) {
      sql += ` AND status = $${paramIdx++}`;
      params.push(filters.status);
    }
    if (filters.priority) {
      sql += ` AND priority = $${paramIdx++}`;
      params.push(filters.priority);
    }

    sql += ` ORDER BY deadline ASC, created_at DESC`;

    const limit = pagination.limit || 100;
    const page = pagination.page || 1;
    const offset = (page - 1) * limit;

    let countSqlFinal = `SELECT COUNT(*) FROM assignments WHERE workspace_id = $1 AND archived_at IS NULL`;
    const countParams: any[] = [workspaceId];
    let countParamIdx = 2;
    if (filters.milestoneId) {
      countSqlFinal += ` AND milestone_id = $${countParamIdx++}`;
      countParams.push(filters.milestoneId);
    }
    if (filters.contributorId) {
      countSqlFinal += ` AND contributor_id = $${countParamIdx++}`;
      countParams.push(filters.contributorId);
    }
    if (filters.reviewerId) {
      countSqlFinal += ` AND reviewer_id = $${countParamIdx++}`;
      countParams.push(filters.reviewerId);
    }
    if (filters.status) {
      countSqlFinal += ` AND status = $${countParamIdx++}`;
      countParams.push(filters.status);
    }
    if (filters.priority) {
      countSqlFinal += ` AND priority = $${countParamIdx++}`;
      countParams.push(filters.priority);
    }

    sql += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, offset);

    const [res, countRes] = await Promise.all([
      query(sql, params),
      query(countSqlFinal, countParams)
    ]);
    const totalCount = parseInt(countRes.rows[0].count, 10);

    const items = res.rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: null,
      archivedBy: null,
      workspaceId: row.workspace_id,
      milestoneId: row.milestone_id,
      contributorId: row.contributor_id,
      reviewerId: row.reviewer_id,
      title: row.title,
      description: row.description,
      priority: row.priority as AssignmentPriority,
      tags: row.tags || [],
      assignedOn: row.assigned_on.toISOString(),
      deadline: row.deadline.toISOString(),
      status: row.status as AssignmentStatus,
      revisionCount: row.revision_count,
      version: row.version,
    }));

    return { items, totalCount };
  }
}
