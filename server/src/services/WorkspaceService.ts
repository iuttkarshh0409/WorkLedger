import { WorkspaceCommandRepository, WorkspaceQueryRepository } from '../repositories/WorkspaceRepository.js';
import { ActivityService } from './ActivityService.js';
import { Workspace, WorkspaceStatus } from '../types/domain.js';
import { randomUUID } from 'crypto';

export class WorkspaceService {
  constructor(
    private readonly workspaceCommand: WorkspaceCommandRepository,
    private readonly workspaceQuery: WorkspaceQueryRepository,
    private readonly activityService: ActivityService
  ) {}

  async createWorkspace(
    input: { name: string; description: string; ownerId: string },
    requestId: string
  ): Promise<Workspace> {
    if (!input.name || !input.description || !input.ownerId) {
      throw { status: 400, code: 'VALIDATION_ERROR', message: 'Name, description, and ownerId are required.' };
    }

    const now = new Date().toISOString();
    const workspace: Workspace = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      archivedBy: null,
      name: input.name,
      description: input.description,
      ownerId: input.ownerId,
      status: WorkspaceStatus.Active,
      version: 1,
    };

    await this.workspaceCommand.create(workspace);

    await this.activityService.recordActivity({
      workspaceId: workspace.id,
      performedBy: workspace.ownerId,
      type: 'Workspace Created' as any,
      timestamp: now,
      assignmentId: null,
      contributorId: null,
      reviewId: null,
      submissionId: null,
      metadata: { workspaceName: workspace.name },
    }, requestId);

    return workspace;
  }

  async updateWorkspace(
    id: string,
    input: { name?: string; description?: string; status?: WorkspaceStatus },
    performedBy: string,
    requestId: string
  ): Promise<Workspace> {
    const updated = await this.workspaceCommand.updatePartial(id, input);

    await this.activityService.recordActivity({
      workspaceId: id,
      performedBy,
      type: 'Workspace Updated' as any,
      timestamp: new Date().toISOString(),
      assignmentId: null,
      contributorId: null,
      reviewId: null,
      submissionId: null,
      metadata: {},
    }, requestId);

    return updated;
  }

  async archiveWorkspace(id: string, performedBy: string, requestId: string): Promise<Workspace> {
    const updated = await this.workspaceCommand.archive(id, performedBy);

    const now = new Date().toISOString();
    await this.activityService.recordActivity({
      workspaceId: id,
      performedBy,
      type: 'Workspace Archived' as any,
      timestamp: now,
      assignmentId: null,
      contributorId: null,
      reviewId: null,
      submissionId: null,
      metadata: { workspaceName: updated.name },
    }, requestId);

    return updated;
  }

  async getWorkspaceById(id: string): Promise<Workspace> {
    const ws = await this.workspaceQuery.findById(id);
    if (!ws) {
      throw { status: 404, code: 'NOT_FOUND', message: `Workspace with id ${id} not found.` };
    }
    return ws;
  }

  async getWorkspacesByOwner(ownerId: string): Promise<Workspace[]> {
    return this.workspaceQuery.findByOwner(ownerId);
  }

  async getAllWorkspaces(): Promise<Workspace[]> {
    return this.workspaceQuery.findAll();
  }
}
