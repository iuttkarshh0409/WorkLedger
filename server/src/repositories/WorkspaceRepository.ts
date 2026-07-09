import { query } from '../db.js';
import { Workspace, WorkspaceStatus } from '../types/domain.js';
import { ttlCache } from '../services/cache.js';

export class WorkspaceCommandRepository {
  async create(ws: Workspace): Promise<void> {
    if (!ws.ownerName || !ws.ownerEmail) {
      throw { status: 400, code: 'VALIDATION_ERROR', message: 'ownerName and ownerEmail are required to create a workspace.' };
    }
    await query(
      `WITH inserted_workspace AS (
         INSERT INTO workspaces (id, created_at, updated_at, name, description, owner_id, status, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, created_at, updated_at
      )
      INSERT INTO contributors (id, created_at, updated_at, workspace_id, name, email, avatar, role, joined_at, status, version)
      VALUES ($6, $2, $3, $1, $9, $10, $11, $12, $2, $13, $8)
      ON CONFLICT (id) DO NOTHING`,
      [
        ws.id,
        ws.createdAt,
        ws.updatedAt,
        ws.name,
        ws.description,
        ws.ownerId,
        ws.status,
        ws.version,
        ws.ownerName,
        ws.ownerEmail,
        '',
        'Owner',
        'Active'
      ]
    );
    ttlCache.invalidate('workspace');
  }

  async update(ws: Workspace): Promise<void> {
    const res = await query(
      `UPDATE workspaces
       SET name = $1, description = $2, owner_id = $3, status = $4, version = version + 1, updated_at = NOW()
       WHERE id = $5 AND version = $6 AND archived_at IS NULL`,
      [ws.name, ws.description, ws.ownerId, ws.status, ws.id, ws.version]
    );
    if (res.rowCount === 0) {
      throw {
        status: 409,
        code: 'RESOURCE_CONFLICT',
        message: 'Workspace was modified by another transaction or has been archived.',
      };
    }
    ttlCache.invalidate('workspace');
  }

  async updatePartial(
    id: string,
    fields: Partial<Workspace>,
    version?: number
  ): Promise<Workspace> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    params.push(id);
    const idIdx = paramIdx++;

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      updates.push(`${snakeKey} = $${paramIdx++}`);
      params.push(value);
    }

    let queryStr = `UPDATE workspaces SET ${updates.join(', ')}, version = version + 1, updated_at = NOW() WHERE id = $${idIdx} AND archived_at IS NULL`;
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
        message: 'Workspace not found or modified by another transaction.',
      };
    }
    const row = res.rows[0];
    ttlCache.invalidate('workspace');
    return {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
      archivedBy: row.archived_by,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      status: row.status as WorkspaceStatus,
      version: row.version,
    };
  }

  async archive(id: string, performedBy: string): Promise<Workspace> {
    const res = await query(
      `UPDATE workspaces
       SET archived_at = NOW(), archived_by = $1, status = 'Archived', version = version + 1, updated_at = NOW()
       WHERE id = $2 AND archived_at IS NULL
       RETURNING *`,
      [performedBy, id]
    );
    if (res.rowCount === 0) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: 'Workspace not found or already archived.',
      };
    }
    const row = res.rows[0];
    ttlCache.invalidate('workspace');
    return {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at.toISOString(),
      archivedBy: row.archived_by,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      status: row.status as WorkspaceStatus,
      version: row.version,
    };
  }
}

export class WorkspaceQueryRepository {
  async findById(id: string): Promise<Workspace | null> {
    const cacheKey = `workspace:${id}`;
    const cached = ttlCache.get<Workspace>(cacheKey);
    if (cached) return cached;

    const res = await query(
      `SELECT * FROM workspaces WHERE id = $1 AND archived_at IS NULL`,
      [id]
    );
    if (res.rowCount === 0) return null;
    const row = res.rows[0];
    const ws = {
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: row.archived_at ? row.archived_at.toISOString() : null,
      archivedBy: row.archived_by,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      status: row.status as WorkspaceStatus,
      version: row.version,
    };
    ttlCache.set(cacheKey, ws);
    return ws;
  }

  async findAll(): Promise<Workspace[]> {
    const cacheKey = `workspace:all`;
    const cached = ttlCache.get<Workspace[]>(cacheKey);
    if (cached) return cached;

    const res = await query(
      `SELECT * FROM workspaces WHERE archived_at IS NULL ORDER BY created_at DESC`
    );
    const list = res.rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: null,
      archivedBy: null,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      status: row.status as WorkspaceStatus,
      version: row.version,
    }));
    ttlCache.set(cacheKey, list);
    return list;
  }

  async findByOwner(ownerId: string): Promise<Workspace[]> {
    const cacheKey = `workspace:owner:${ownerId}`;
    const cached = ttlCache.get<Workspace[]>(cacheKey);
    if (cached) return cached;

    const res = await query(
      `SELECT * FROM workspaces WHERE owner_id = $1 AND archived_at IS NULL ORDER BY created_at DESC`,
      [ownerId]
    );
    const list = res.rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      archivedAt: null,
      archivedBy: null,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      status: row.status as WorkspaceStatus,
      version: row.version,
    }));
    ttlCache.set(cacheKey, list);
    return list;
  }
}
