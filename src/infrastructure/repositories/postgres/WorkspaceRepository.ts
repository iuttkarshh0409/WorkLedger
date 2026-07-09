import type { IWorkspaceRepository, Workspace, AnyDomainError, EntityId } from '@domain';
import { request } from './baseClient';

type Res<T> = Promise<T | AnyDomainError>;

export class WorkspaceRepository implements IWorkspaceRepository {
  async create(workspace: Workspace): Res<Workspace> {
    return request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(workspace),
    });
  }

  async update(workspace: Workspace): Res<Workspace> {
    return request<Workspace>(`/workspaces/${workspace.id}`, {
      method: 'PUT',
      body: JSON.stringify(workspace),
    });
  }

  async findById(id: EntityId): Res<Workspace | null> {
    const res = await request<Workspace>(`/workspaces/${id}`);
    if (res && (res as any).kind === 'NotFoundError') {
      return null;
    }
    return res as any;
  }

  async findByOwner(ownerId: EntityId): Res<Workspace[]> {
    return request<Workspace[]>(`/workspaces?ownerId=${ownerId}`);
  }

  async findAll(): Res<Workspace[]> {
    return request<Workspace[]>('/workspaces');
  }

  async exists(id: EntityId): Res<boolean> {
    const ws = await this.findById(id);
    if (!ws || (ws as any).kind) return false;
    return true;
  }
}
