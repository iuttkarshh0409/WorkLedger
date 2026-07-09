import { query } from '../db.js';
import { Milestone, MilestoneStatus } from '../types/domain.js';
import { ttlCache } from '../services/cache.js';

export class MilestoneCommandRepository {
  async create(m: Milestone): Promise<void> {
    await query(
      `INSERT INTO milestones (id, created_at, updated_at, workspace_id, title, description, start_date, deadline, status, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [m.id, m.createdAt, m.updatedAt, m.workspaceId, m.title, m.description, m.startDate, m.deadline, m.status, m.version]
    );
    ttlCache.invalidate('milestone');
  }

  async update(m: Milestone): Promise<void> {
    const res = await query(
      `UPDATE milestones
       SET title = $1, description = $2, start_date = $3, deadline = $4, status = $5, version = version + 1, updated_at = NOW()
       WHERE id = $6 AND version = $7 AND archived_at IS NULL`,
      [m.title, m.description, m.startDate, m.deadline, m.status, m.id, m.version]
    );
    if (res.rowCount === 0) {
      throw {
        status: 409,
        code: 'RESOURCE_CONFLICT',
        message: 'Milestone was modified by another transaction or has been archived.',
      };
    }
    ttlCache.invalidate('milestone');
  }

  async updatePartial(
    id: string,
    fields: Partial<Milestone>,
    version?: number
  ): Promise<{ updated: Milestone; oldStatus: MilestoneStatus }> {
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

    let queryStr = `
      WITH old_milestone AS (
        SELECT status FROM milestones WHERE id = $${idIdx}
      ),
      updated_milestone AS (
        UPDATE milestones
        SET ${updates.join(', ')}, version = version + 1, updated_at = NOW()
        WHERE id = $${idIdx} AND archived_at IS NULL
    `;
    if (version !== undefined) {
      params.push(version);
      queryStr += ` AND version = $${paramIdx++}`;
    }
    queryStr += `
        RETURNING *
      )
      SELECT u.*, o.status AS old_status
      FROM updated_milestone u
      CROSS JOIN old_milestone o
    `;

    const res = await query(queryStr, params);
    if (res.rowCount === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Milestone not found or modified by another transaction.',
      };
    }
    const row = res.rows[0];
    const updated: Milestone = {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
      archivedBy: row.archived_by,
      workspaceId: row.workspace_id,
      title: row.title,
      description: row.description,
      startDate: row.start_date.toISOString(),
      deadline: row.deadline.toISOString(),
      status: row.status as MilestoneStatus,
      version: row.version,
    };
    ttlCache.invalidate('milestone');
    return { updated, oldStatus: row.old_status as MilestoneStatus };
  }

  async archive(id: string, performedBy: string): Promise<Milestone> {
    const res = await query(
      `UPDATE milestones
       SET archived_at = NOW(), archived_by = $1, status = 'Archived', version = version + 1, updated_at = NOW()
       WHERE id = $2 AND archived_at IS NULL
       RETURNING *`,
      [performedBy, id]
    );
    if (res.rowCount === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Milestone not found or already archived.',
      };
    }
    const row = res.rows[0];
    ttlCache.invalidate('milestone');
    return {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at.toISOString(),
      archivedBy: row.archived_by,
      workspaceId: row.workspace_id,
      title: row.title,
      description: row.description,
      startDate: row.start_date.toISOString(),
      deadline: row.deadline.toISOString(),
      status: row.status as MilestoneStatus,
      version: row.version,
    };
  }
}

export class MilestoneQueryRepository {
  async findById(id: string): Promise<Milestone | null> {
    const cacheKey = `milestone:${id}`;
    const cached = ttlCache.get<Milestone>(cacheKey);
    if (cached) return cached;

    const res = await query(
      `SELECT * FROM milestones WHERE id = $1 AND archived_at IS NULL`,
      [id]
    );
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    const m = {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
      archivedBy: row.archived_by,
      workspaceId: row.workspace_id,
      title: row.title,
      description: row.description,
      startDate: row.start_date.toISOString(),
      deadline: row.deadline.toISOString(),
      status: row.status as MilestoneStatus,
      version: row.version,
    };
    ttlCache.set(cacheKey, m);
    return m;
  }

  async findByWorkspace(workspaceId: string, status?: MilestoneStatus): Promise<Milestone[]> {
    const cacheKey = `milestone:workspace:${workspaceId}${status ? `:${status}` : ''}`;
    const cached = ttlCache.get<Milestone[]>(cacheKey);
    if (cached) return cached;

    let sql = `SELECT * FROM milestones WHERE workspace_id = $1 AND archived_at IS NULL`;
    const params: any[] = [workspaceId];
    if (status) {
      sql += ` AND status = $2`;
      params.push(status);
    }
    sql += ` ORDER BY deadline ASC`;

    const res = await query(sql, params);
    const list = res.rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: null,
      archivedBy: null,
      workspaceId: row.workspace_id,
      title: row.title,
      description: row.description,
      startDate: row.start_date.toISOString(),
      deadline: row.deadline.toISOString(),
      status: row.status as MilestoneStatus,
      version: row.version,
    }));
    ttlCache.set(cacheKey, list);
    return list;
  }
}
