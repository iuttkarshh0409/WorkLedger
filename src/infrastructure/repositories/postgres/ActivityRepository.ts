import type { IActivityRepository, Activity, AnyDomainError, EntityId, ActivityType } from '@domain';
import { request } from './baseClient';

type Res<T> = Promise<T | AnyDomainError>;

interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
}

export class ActivityRepository implements IActivityRepository {
  async create(activity: Activity): Res<Activity> {
    // Activity logs are created server-side as side effects of domain service mutations.
    // We return the activity directly to satisfy the interface.
    return activity;
  }

  async findById(id: EntityId): Res<Activity | null> {
    // Activities don't need direct lookup by id in the frontend, but if called:
    const list = await this.findByWorkspace('');
    if ((list as any).kind) return list as any;
    return (list as Activity[]).find((a) => a.id === id) ?? null;
  }

  async findByWorkspace(workspaceId: EntityId): Res<Activity[]> {
    const res = await request<PaginatedResult<Activity>>(`/activities?workspaceId=${workspaceId}&limit=1000`);
    if ((res as any).kind) return res as any;
    return (res as PaginatedResult<Activity>).items;
  }

  async findByAssignment(assignmentId: EntityId): Res<Activity[]> {
    // We fetch workspace activities and filter locally, or query with a filter
    let workspaceId = '';
    const stored = localStorage.getItem('wl:session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        workspaceId = parsed.workspaceId || '';
      } catch (e) {
        // Ignore
      }
    }
    const res = await request<PaginatedResult<Activity>>(`/activities?workspaceId=${workspaceId}&limit=1000`);
    if ((res as any).kind) return res as any;
    return (res as PaginatedResult<Activity>).items.filter((a) => a.assignmentId === assignmentId);
  }

  async findByContributor(workspaceId: EntityId, contributorId: EntityId): Res<Activity[]> {
    const res = await request<PaginatedResult<Activity>>(
      `/activities?workspaceId=${workspaceId}&performedBy=${contributorId}&limit=1000`
    );
    if ((res as any).kind) return res as any;
    return (res as PaginatedResult<Activity>).items;
  }

  async findByType(workspaceId: EntityId, type: ActivityType): Res<Activity[]> {
    const res = await request<PaginatedResult<Activity>>(
      `/activities?workspaceId=${workspaceId}&type=${type}&limit=1000`
    );
    if ((res as any).kind) return res as any;
    return (res as PaginatedResult<Activity>).items;
  }
}
