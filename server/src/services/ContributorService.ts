import { ContributorCommandRepository, ContributorQueryRepository } from '../repositories/ContributorRepository.js';
import { ActivityService } from './ActivityService.js';
import { Contributor, ContributorStatus, ContributorRole } from '../types/domain.js';
import { randomUUID } from 'crypto';

export class ContributorService {
  constructor(
    private readonly contributorCommand: ContributorCommandRepository,
    private readonly contributorQuery: ContributorQueryRepository,
    private readonly activityService: ActivityService
  ) {}

  async createContributor(
    input: { id?: string; workspaceId: string; name: string; email: string; avatar?: string; role?: ContributorRole },
    performedBy: string,
    requestId: string
  ): Promise<Contributor> {
    if (!input.workspaceId || !input.name || !input.email) {
      throw { status: 400, code: 'VALIDATION_ERROR', message: 'workspaceId, name, and email are required.' };
    }

    try {
      // Check if contributor with this ID already exists (e.g. the placeholder created during workspace initialization)
      if (input.id) {
        const existingById = await this.contributorQuery.findById(input.id, true);
        if (existingById) {
          // Enforce email uniqueness check
          const emailConflict = await this.contributorQuery.findByEmail(input.workspaceId, input.email);
          if (emailConflict && emailConflict.id !== input.id) {
            throw { status: 400, code: 'CONTRIBUTOR_ALREADY_EXISTS', message: 'A contributor with this email already exists in this workspace.' };
          }

          const updated: Contributor = {
            ...existingById,
            workspaceId: input.workspaceId,
            name: input.name,
            email: input.email,
            avatar: input.avatar || existingById.avatar || '',
            role: input.role || existingById.role,
            updatedAt: new Date().toISOString(),
          };

          await this.contributorCommand.update(updated);

          await this.activityService.recordActivity({
            workspaceId: input.workspaceId,
            performedBy: performedBy === 'system-bootstrap' || performedBy === 'system' ? updated.id : performedBy,
            type: 'Contributor Joined' as any,
            timestamp: new Date().toISOString(),
            assignmentId: null,
            contributorId: updated.id,
            reviewId: null,
            submissionId: null,
            metadata: { contributorName: updated.name },
          }, requestId);

          return updated;
        }
      }

      const existing = await this.contributorQuery.findByEmail(input.workspaceId, input.email);
      if (existing) {
        throw { status: 400, code: 'CONTRIBUTOR_ALREADY_EXISTS', message: 'A contributor with this email already exists in this workspace.' };
      }

      const now = new Date().toISOString();
      const contributor: Contributor = {
        id: input.id || randomUUID(),
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        archivedBy: null,
        workspaceId: input.workspaceId,
        name: input.name,
        email: input.email,
        avatar: input.avatar || '',
        role: input.role || ContributorRole.Contributor,
        joinedAt: now,
        status: ContributorStatus.Active,
        version: 1,
      };

      await this.contributorCommand.create(contributor);

      await this.activityService.recordActivity({
        workspaceId: input.workspaceId,
        performedBy: performedBy === 'system-bootstrap' || performedBy === 'system' ? contributor.id : performedBy,
        type: 'Contributor Joined' as any,
        timestamp: now,
        assignmentId: null,
        contributorId: contributor.id,
        reviewId: null,
        submissionId: null,
        metadata: { contributorName: contributor.name },
      }, requestId);

      return contributor;
    } catch (err: any) {
      if (err.status) throw err;
      if (err.code === '23505') {
        throw {
          status: 400,
          code: 'CONTRIBUTOR_ALREADY_EXISTS',
          message: 'A contributor with this email already exists in this workspace.',
          details: { dbCode: err.code, dbMessage: err.message, dbDetail: err.detail }
        };
      }
      if (err.code === '23503') {
        throw {
          status: 400,
          code: 'INVALID_REFERENCE',
          message: 'Referenced workspace or contributor does not exist.',
          details: { dbCode: err.code, dbMessage: err.message, dbDetail: err.detail }
        };
      }
      throw err;
    }
  }

  async updateContributor(
    id: string,
    input: { name?: string; email?: string; avatar?: string; role?: ContributorRole; status?: ContributorStatus },
    performedBy: string,
    requestId: string
  ): Promise<Contributor> {
    try {
      const updated = await this.contributorCommand.updatePartial(id, input);

      await this.activityService.recordActivity({
        workspaceId: updated.workspaceId,
        performedBy,
        type: 'Contributor Updated' as any,
        timestamp: new Date().toISOString(),
        assignmentId: null,
        contributorId: id,
        reviewId: null,
        submissionId: null,
        metadata: {},
      }, requestId);

      return updated;
    } catch (err: any) {
      if (err.code === '23505') {
        throw { status: 400, code: 'EMAIL_CONFLICT', message: 'Email address already in use by another contributor.' };
      }
      throw err;
    }
  }

  async archiveContributor(id: string, performedBy: string, requestId: string): Promise<Contributor> {
    const updated = await this.contributorCommand.archive(id, performedBy);

    const now = new Date().toISOString();
    await this.activityService.recordActivity({
      workspaceId: updated.workspaceId,
      performedBy,
      type: 'Contributor Archived' as any,
      timestamp: now,
      assignmentId: null,
      contributorId: id,
      reviewId: null,
      submissionId: null,
      metadata: { contributorName: updated.name },
    }, requestId);

    return updated;
  }

  async getContributorById(id: string): Promise<Contributor> {
    const c = await this.contributorQuery.findById(id);
    if (!c) {
      throw { status: 404, code: 'NOT_FOUND', message: `Contributor with id ${id} not found.` };
    }
    return c;
  }

  async getContributorsByWorkspace(workspaceId: string): Promise<Contributor[]> {
    return this.contributorQuery.findByWorkspace(workspaceId);
  }
}
