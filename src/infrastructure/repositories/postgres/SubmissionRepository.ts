import type { ISubmissionRepository, Submission, AnyDomainError, EntityId } from '@domain';
import { request } from './baseClient';

import { isDomainError } from '@lib/errors';

type Res<T> = Promise<T | AnyDomainError>;

export class SubmissionRepository implements ISubmissionRepository {
  async create(submission: Submission): Res<Submission> {
    return request<Submission>('/submissions', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  }

  async findById(id: EntityId): Res<Submission | null> {
    const res = await request<Submission>(`/submissions/${id}`);
    if (res && (res as any).kind === 'NotFoundError') {
      return null;
    }
    return res as any;
  }

  async findByAssignment(assignmentId: EntityId): Res<Submission[]> {
    return request<Submission[]>(`/submissions/assignment/${assignmentId}`);
  }

  async findLatestByAssignment(assignmentId: EntityId): Res<Submission | null> {
    const list = await this.findByAssignment(assignmentId);
    if (isDomainError(list)) return list;
    if (list.length === 0) return null;
    return list[0]; // Server returns latest-first
  }

  async exists(id: EntityId): Res<boolean> {
    const s = await this.findById(id);
    if (!s || (s as any).kind) return false;
    return true;
  }
}
