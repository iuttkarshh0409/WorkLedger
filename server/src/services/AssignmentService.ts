import { AssignmentCommandRepository, AssignmentQueryRepository } from '../repositories/AssignmentRepository.js';
import { ActivityService } from './ActivityService.js';
import { Assignment, AssignmentStatus, AssignmentPriority } from '../types/domain.js';
import { randomUUID } from 'crypto';

export class AssignmentService {
  constructor(
    private readonly assignmentCommand: AssignmentCommandRepository,
    private readonly assignmentQuery: AssignmentQueryRepository,
    private readonly activityService: ActivityService
  ) {}

  async createAssignment(
    input: {
      workspaceId: string;
      milestoneId?: string | null;
      contributorId: string;
      reviewerId?: string | null;
      title: string;
      description: string;
      priority?: AssignmentPriority;
      tags?: string[];
      assignedOn: string;
      deadline: string;
    },
    performedBy: string,
    requestId: string
  ): Promise<Assignment> {
    if (!input.workspaceId || !input.contributorId || !input.title || !input.description || !input.assignedOn || !input.deadline) {
      throw { status: 400, code: 'VALIDATION_ERROR', message: 'workspaceId, contributorId, title, description, assignedOn, and deadline are required.' };
    }

    const now = new Date().toISOString();
    const assignment: Assignment = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      archivedBy: null,
      workspaceId: input.workspaceId,
      milestoneId: input.milestoneId || null,
      contributorId: input.contributorId,
      reviewerId: input.reviewerId || null,
      title: input.title,
      description: input.description,
      priority: input.priority || AssignmentPriority.Medium,
      tags: input.tags || [],
      assignedOn: input.assignedOn,
      deadline: input.deadline,
      status: AssignmentStatus.Assigned,
      revisionCount: 0,
      version: 1,
    };

    await this.assignmentCommand.create(assignment);

    await this.activityService.recordActivity({
      workspaceId: input.workspaceId,
      performedBy,
      type: 'Assignment Created' as any,
      timestamp: now,
      assignmentId: assignment.id,
      contributorId: input.contributorId,
      reviewId: null,
      submissionId: null,
      metadata: { assignmentTitle: assignment.title },
    }, requestId);

    return assignment;
  }

  async updateAssignment(
    id: string,
    input: {
      milestoneId?: string | null;
      contributorId?: string;
      reviewerId?: string | null;
      title?: string;
      description?: string;
      priority?: AssignmentPriority;
      tags?: string[];
      assignedOn?: string;
      deadline?: string;
      status?: AssignmentStatus;
      revisionCount?: number;
      version?: number;
    },
    performedBy: string,
    requestId: string
  ): Promise<Assignment> {
    const { version, ...fields } = input;
    const { updated, old } = await this.assignmentCommand.updatePartial(id, fields, version || 0);

    const now = new Date().toISOString();

    // Check and record status transitions
    if (updated.status !== old.status) {
      let actType: any = 'Assignment Updated';
      if (updated.status === AssignmentStatus.Accepted) {
        actType = 'Assignment Accepted';
      } else if (updated.status === AssignmentStatus.Completed) {
        actType = 'Assignment Completed';
      }

      await this.activityService.recordActivity({
        workspaceId: old.workspaceId,
        performedBy,
        type: actType,
        timestamp: now,
        assignmentId: id,
        contributorId: updated.contributorId,
        reviewId: null,
        submissionId: null,
        metadata: { oldStatus: old.status, newStatus: updated.status },
      }, requestId);
    }

    // Check and record deadline changes
    if (updated.deadline !== old.deadline) {
      await this.activityService.recordActivity({
        workspaceId: old.workspaceId,
        performedBy,
        type: 'Deadline Changed' as any,
        timestamp: now,
        assignmentId: id,
        contributorId: updated.contributorId,
        reviewId: null,
        submissionId: null,
        metadata: { oldDeadline: old.deadline, newDeadline: updated.deadline },
      }, requestId);
    }

    return updated;
  }

  async archiveAssignment(id: string, performedBy: string, requestId: string): Promise<Assignment> {
    const updated = await this.assignmentCommand.archive(id, performedBy);

    const now = new Date().toISOString();
    await this.activityService.recordActivity({
      workspaceId: updated.workspaceId,
      performedBy,
      type: 'Assignment Archived' as any,
      timestamp: now,
      assignmentId: id,
      contributorId: updated.contributorId,
      reviewId: null,
      submissionId: null,
      metadata: { assignmentTitle: updated.title },
    }, requestId);

    return updated;
  }

  async getAssignmentById(id: string): Promise<Assignment> {
    const a = await this.assignmentQuery.findById(id);
    if (!a) {
      throw { status: 404, code: 'NOT_FOUND', message: `Assignment with id ${id} not found.` };
    }
    return a;
  }

  async getAssignmentsByWorkspace(workspaceId: string, filters?: any, pagination?: any) {
    return this.assignmentQuery.findByWorkspace(workspaceId, filters, pagination);
  }
}
