import type { IAssignmentRepository, Assignment, AnyDomainError, EntityId, AssignmentStatus } from '@domain';
import { request } from './baseClient';

type Res<T> = Promise<T | AnyDomainError>;

interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
}

export class AssignmentRepository implements IAssignmentRepository {
  async create(assignment: Assignment): Res<Assignment> {
    return request<Assignment>('/assignments', {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  }

  async update(assignment: Assignment): Res<Assignment> {
    return request<Assignment>(`/assignments/${assignment.id}`, {
      method: 'PATCH',
      body: JSON.stringify(assignment),
    });
  }

  async findById(id: EntityId): Res<Assignment | null> {
    const res = await request<Assignment>(`/assignments/${id}`);
    if (res && (res as any).kind === 'NotFoundError') {
      return null;
    }
    return res as any;
  }

  async findByWorkspace(workspaceId: EntityId): Res<Assignment[]> {
    const res = await request<PaginatedResult<Assignment>>(`/assignments?workspaceId=${workspaceId}&limit=1000`);
    if ((res as any).kind) return res as any;
    return (res as PaginatedResult<Assignment>).items;
  }

  async findByContributor(workspaceId: EntityId, contributorId: EntityId): Res<Assignment[]> {
    const res = await request<PaginatedResult<Assignment>>(
      `/assignments?workspaceId=${workspaceId}&contributorId=${contributorId}&limit=1000`
    );
    if ((res as any).kind) return res as any;
    return (res as PaginatedResult<Assignment>).items;
  }

  async findByMilestone(workspaceId: EntityId, milestoneId: EntityId): Res<Assignment[]> {
    const res = await request<PaginatedResult<Assignment>>(
      `/assignments?workspaceId=${workspaceId}&milestoneId=${milestoneId}&limit=1000`
    );
    if ((res as any).kind) return res as any;
    return (res as PaginatedResult<Assignment>).items;
  }

  async findByStatus(workspaceId: EntityId, status: AssignmentStatus): Res<Assignment[]> {
    const res = await request<PaginatedResult<Assignment>>(
      `/assignments?workspaceId=${workspaceId}&status=${status}&limit=1000`
    );
    if ((res as any).kind) return res as any;
    return (res as PaginatedResult<Assignment>).items;
  }

  async findByReviewer(workspaceId: EntityId, reviewerId: EntityId): Res<Assignment[]> {
    const res = await request<PaginatedResult<Assignment>>(
      `/assignments?workspaceId=${workspaceId}&reviewerId=${reviewerId}&limit=1000`
    );
    if ((res as any).kind) return res as any;
    return (res as PaginatedResult<Assignment>).items;
  }

  async exists(id: EntityId): Res<boolean> {
    const a = await this.findById(id);
    if (!a || (a as any).kind) return false;
    return true;
  }

  async delete(id: EntityId): Res<void> {
    return request<void>(`/assignments/${id}`, {
      method: 'DELETE',
    });
  }
}
