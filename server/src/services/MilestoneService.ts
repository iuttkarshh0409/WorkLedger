import { MilestoneCommandRepository, MilestoneQueryRepository } from '../repositories/MilestoneRepository.js';
import { ActivityService } from './ActivityService.js';
import { Milestone, MilestoneStatus } from '../types/domain.js';
import { randomUUID } from 'crypto';

export class MilestoneService {
  constructor(
    private readonly milestoneCommand: MilestoneCommandRepository,
    private readonly milestoneQuery: MilestoneQueryRepository,
    private readonly activityService: ActivityService
  ) {}

  async createMilestone(
    input: { workspaceId: string; title: string; description: string; startDate: string; deadline: string; status?: MilestoneStatus },
    performedBy: string,
    requestId: string
  ): Promise<Milestone> {
    if (!input.workspaceId || !input.title || !input.description || !input.startDate || !input.deadline) {
      throw { status: 400, code: 'VALIDATION_ERROR', message: 'workspaceId, title, description, startDate, and deadline are required.' };
    }

    const now = new Date().toISOString();
    const milestone: Milestone = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      archivedBy: null,
      workspaceId: input.workspaceId,
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      deadline: input.deadline,
      status: input.status || MilestoneStatus.Planned,
      version: 1,
    };

    await this.milestoneCommand.create(milestone);

    await this.activityService.recordActivity({
      workspaceId: input.workspaceId,
      performedBy,
      type: 'Milestone Created' as any,
      timestamp: now,
      assignmentId: null,
      contributorId: null,
      reviewId: null,
      submissionId: null,
      metadata: { milestoneTitle: milestone.title },
    }, requestId);

    return milestone;
  }

  async updateMilestone(
    id: string,
    input: { title?: string; description?: string; startDate?: string; deadline?: string; status?: MilestoneStatus },
    performedBy: string,
    requestId: string
  ): Promise<Milestone> {
    const { updated, oldStatus } = await this.milestoneCommand.updatePartial(id, input);

    const isCompletedTransition = input.status === MilestoneStatus.Completed && oldStatus !== MilestoneStatus.Completed;

    await this.activityService.recordActivity({
      workspaceId: updated.workspaceId,
      performedBy,
      type: (isCompletedTransition ? 'Milestone Completed' : 'Milestone Updated') as any,
      timestamp: new Date().toISOString(),
      assignmentId: null,
      contributorId: null,
      reviewId: null,
      submissionId: null,
      metadata: { milestoneTitle: updated.title },
    }, requestId);

    return updated;
  }

  async archiveMilestone(id: string, performedBy: string, requestId: string): Promise<Milestone> {
    const updated = await this.milestoneCommand.archive(id, performedBy);

    const now = new Date().toISOString();
    await this.activityService.recordActivity({
      workspaceId: updated.workspaceId,
      performedBy,
      type: 'Milestone Archived' as any,
      timestamp: now,
      assignmentId: null,
      contributorId: null,
      reviewId: null,
      submissionId: null,
      metadata: { milestoneTitle: updated.title },
    }, requestId);

    return updated;
  }

  async getMilestoneById(id: string): Promise<Milestone> {
    const m = await this.milestoneQuery.findById(id);
    if (!m) {
      throw { status: 404, code: 'NOT_FOUND', message: `Milestone with id ${id} not found.` };
    }
    return m;
  }

  async getMilestonesByWorkspace(workspaceId: string, status?: MilestoneStatus): Promise<Milestone[]> {
    return this.milestoneQuery.findByWorkspace(workspaceId, status);
  }
}
