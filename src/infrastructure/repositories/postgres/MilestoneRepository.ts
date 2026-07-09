import type { IMilestoneRepository, Milestone, AnyDomainError, EntityId, MilestoneStatus } from '@domain';
import { request } from './baseClient';

type Res<T> = Promise<T | AnyDomainError>;

export class MilestoneRepository implements IMilestoneRepository {
  async create(milestone: Milestone): Res<Milestone> {
    return request<Milestone>('/milestones', {
      method: 'POST',
      body: JSON.stringify(milestone),
    });
  }

  async update(milestone: Milestone): Res<Milestone> {
    return request<Milestone>(`/milestones/${milestone.id}`, {
      method: 'PUT',
      body: JSON.stringify(milestone),
    });
  }

  async findById(id: EntityId): Res<Milestone | null> {
    const res = await request<Milestone>(`/milestones/${id}`);
    if (res && (res as any).kind === 'NotFoundError') {
      return null;
    }
    return res as any;
  }

  async findByWorkspace(workspaceId: EntityId): Res<Milestone[]> {
    return request<Milestone[]>(`/milestones?workspaceId=${workspaceId}`);
  }

  async findByStatus(workspaceId: EntityId, status: MilestoneStatus): Res<Milestone[]> {
    return request<Milestone[]>(`/milestones?workspaceId=${workspaceId}&status=${status}`);
  }

  async exists(id: EntityId): Res<boolean> {
    const m = await this.findById(id);
    if (!m || (m as any).kind) return false;
    return true;
  }
}
