import type { IContributorRepository, Contributor, AnyDomainError, EntityId } from '@domain';
import { request } from './baseClient';

import { isDomainError } from '@lib/errors';

type Res<T> = Promise<T | AnyDomainError>;

export class ContributorRepository implements IContributorRepository {
  async create(contributor: Contributor): Res<Contributor> {
    return request<Contributor>('/contributors', {
      method: 'POST',
      body: JSON.stringify(contributor),
    });
  }

  async update(contributor: Contributor): Res<Contributor> {
    return request<Contributor>(`/contributors/${contributor.id}`, {
      method: 'PUT',
      body: JSON.stringify(contributor),
    });
  }

  async findById(id: EntityId): Res<Contributor | null> {
    const res = await request<Contributor>(`/contributors/${id}`);
    if (res && (res as any).kind === 'NotFoundError') {
      return null;
    }
    return res as any;
  }

  async findByWorkspace(workspaceId: EntityId): Res<Contributor[]> {
    return request<Contributor[]>(`/contributors?workspaceId=${workspaceId}`);
  }

  async findByEmail(workspaceId: EntityId, email: string): Res<Contributor | null> {
    const list = await this.findByWorkspace(workspaceId);
    if (isDomainError(list)) return list;
    return list.find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null;
  }

  async exists(id: EntityId): Res<boolean> {
    const c = await this.findById(id);
    if (!c || (c as any).kind) return false;
    return true;
  }
}
