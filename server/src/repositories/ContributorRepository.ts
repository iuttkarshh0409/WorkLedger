import { query } from '../db.js';
import { Contributor, ContributorStatus, ContributorRole } from '../types/domain.js';
import { ttlCache } from '../services/cache.js';

export class ContributorCommandRepository {
  async create(c: Contributor): Promise<void> {
    await query(
      `INSERT INTO contributors (id, created_at, updated_at, workspace_id, name, email, avatar, role, joined_at, status, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [c.id, c.createdAt, c.updatedAt, c.workspaceId, c.name, c.email, c.avatar, c.role, c.joinedAt, c.status, c.version]
    );
    ttlCache.invalidate('contributor');
  }

  async update(c: Contributor): Promise<void> {
    const res = await query(
      `UPDATE contributors
       SET name = $1, email = $2, avatar = $3, role = $4, status = $5, version = version + 1, updated_at = NOW(), workspace_id = $8
       WHERE id = $6 AND version = $7 AND archived_at IS NULL`,
      [c.name, c.email, c.avatar, c.role, c.status, c.id, c.version, c.workspaceId]
    );
    if (res.rowCount === 0) {
      throw {
        status: 409,
        code: 'RESOURCE_CONFLICT',
        message: 'Contributor was modified by another transaction or has been archived.',
      };
    }
    ttlCache.invalidate('contributor');
  }

  async updatePartial(
    id: string,
    fields: Partial<Contributor>,
    version?: number
  ): Promise<Contributor> {
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

    let queryStr = `UPDATE contributors SET ${updates.join(', ')}, version = version + 1, updated_at = NOW() WHERE id = $${idIdx} AND archived_at IS NULL`;
    if (version !== undefined) {
      params.push(version);
      queryStr += ` AND version = $${paramIdx++}`;
    }
    queryStr += ` RETURNING *`;

    const res = await query(queryStr, params);
    if (res.rowCount === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Contributor not found or modified by another transaction.',
      };
    }
    const row = res.rows[0];
    ttlCache.invalidate('contributor');
    return {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
      archivedBy: row.archived_by,
      workspaceId: row.workspace_id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      role: row.role as ContributorRole,
      joinedAt: row.joined_at.toISOString(),
      status: row.status as ContributorStatus,
      version: row.version,
    };
  }

  async archive(id: string, performedBy: string): Promise<Contributor> {
    const res = await query(
      `UPDATE contributors
       SET archived_at = NOW(), archived_by = $1, status = 'Archived', version = version + 1, updated_at = NOW()
       WHERE id = $2 AND archived_at IS NULL
       RETURNING *`,
      [performedBy, id]
    );
    if (res.rowCount === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Contributor not found or already archived.',
      };
    }
    const row = res.rows[0];
    ttlCache.invalidate('contributor');
    return {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at.toISOString(),
      archivedBy: row.archived_by,
      workspaceId: row.workspace_id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      role: row.role as ContributorRole,
      joinedAt: row.joined_at.toISOString(),
      status: row.status as ContributorStatus,
      version: row.version,
    };
  }
}

export class ContributorQueryRepository {
  async findById(id: string, bypassCache = false): Promise<Contributor | null> {
    const cacheKey = `contributor:${id}`;
    if (!bypassCache) {
      const cached = ttlCache.get<Contributor>(cacheKey);
      if (cached) return cached;
    }

    const res = await query(
      `SELECT * FROM contributors WHERE id = $1 AND archived_at IS NULL`,
      [id]
    );
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    const c = {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
      archivedBy: row.archived_by,
      workspaceId: row.workspace_id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      role: row.role as ContributorRole,
      joinedAt: row.joined_at.toISOString(),
      status: row.status as ContributorStatus,
      version: row.version,
    };
    ttlCache.set(cacheKey, c);
    return c;
  }

  async findByWorkspace(workspaceId: string): Promise<Contributor[]> {
    const cacheKey = `contributor:workspace:${workspaceId}`;
    const cached = ttlCache.get<Contributor[]>(cacheKey);
    if (cached) return cached;

    const res = await query(
      `SELECT * FROM contributors WHERE workspace_id = $1 AND archived_at IS NULL ORDER BY joined_at ASC`,
      [workspaceId]
    );
    const list = res.rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: null,
      archivedBy: null,
      workspaceId: row.workspace_id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      role: row.role as ContributorRole,
      joinedAt: row.joined_at.toISOString(),
      status: row.status as ContributorStatus,
      version: row.version,
    }));
    ttlCache.set(cacheKey, list);
    return list;
  }

  async findByEmail(workspaceId: string, email: string): Promise<Contributor | null> {
    const res = await query(
      `SELECT * FROM contributors WHERE workspace_id = $1 AND email = $2 AND archived_at IS NULL`,
      [workspaceId, email]
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
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      role: row.role as ContributorRole,
      joinedAt: row.joined_at.toISOString(),
      status: row.status as ContributorStatus,
      version: row.version,
    };
  }
}
