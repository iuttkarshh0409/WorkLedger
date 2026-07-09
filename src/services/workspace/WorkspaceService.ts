/**
 * WorkspaceService
 *
 * Implements IWorkspaceService.
 * Manages the Workspace entity lifecycle and records Activity events.
 *
 * Responsibilities:
 * - Create, update, and archive Workspaces
 * - Validate inputs before persistence
 * - Record Activity events on successful mutations
 *
 * Not responsible for:
 * - Member management (ContributorService)
 * - Assignment management (AssignmentService)
 * - Storage mechanics
 *
 * Authorization note:
 * - `performedBy` is accepted and stored as-is.
 * - Role enforcement (Owner-only operations) will be introduced
 *   when identity management lands.
 *
 * @see src/services/workspace/IWorkspaceService.ts
 * @see docs/04.5_permission_model.md (Workspace Owner permissions)
 */

import type { IWorkspaceService } from './IWorkspaceService';
import type { IWorkspaceRepository, AnyDomainError, EntityId } from '@domain';
import type { Workspace, CreateWorkspaceInput, UpdateWorkspaceInput } from '@domain';
import {
  validateWorkspace,
  validateCreateWorkspaceInput,
  WorkspaceStatus,
  ActivityType,
} from '@domain';
import type { IActivityService } from '../activity/IActivityService';
import { generateId } from '@lib';
import { isDomainError, validationError, notFound } from '@lib/errors';

export class WorkspaceService implements IWorkspaceService {
  constructor(
    private readonly workspaces: IWorkspaceRepository,
    private readonly activityService: IActivityService,
  ) {}

  // ─── Write operations ───────────────────────────────────────────────────────

  async createWorkspace(
    input: CreateWorkspaceInput,
  ): Promise<Workspace | AnyDomainError> {
    const inputValidation = validateCreateWorkspaceInput(input);
    if (!inputValidation.valid) {
      return validationError('WorkspaceService.createWorkspace', inputValidation.errors);
    }

    const now = new Date().toISOString();
    const workspace: Workspace = {
      id:          generateId(),
      createdAt:   now,
      updatedAt:   now,
      name:        input.name,
      description: input.description,
      ownerId:     input.ownerId,
      status:      input.status ?? WorkspaceStatus.Active,
      ownerName:   input.ownerName,
      ownerEmail:  input.ownerEmail,
    };

    const entityValidation = validateWorkspace(workspace);
    if (!entityValidation.valid) {
      return validationError('WorkspaceService.createWorkspace', entityValidation.errors);
    }

    const saved = await this.workspaces.create(workspace);
    if (isDomainError(saved)) return saved;

    await this.activityService.recordActivity({
      workspaceId:  saved.id,
      performedBy:  saved.ownerId,
      type:         ActivityType.WorkspaceCreated,
      timestamp:    now,
      assignmentId: null,
      contributorId: null,
      metadata:     { workspaceName: saved.name },
    });

    return saved;
  }

  async updateWorkspace(
    id: EntityId,
    input: UpdateWorkspaceInput,
    performedBy: EntityId,
  ): Promise<Workspace | AnyDomainError> {
    const existing = await this.workspaces.findById(id);
    if (isDomainError(existing)) return existing;
    if (existing === null) return notFound('Workspace', id);

    const now = new Date().toISOString();
    const updated: Workspace = {
      ...existing,
      name:        input.name        ?? existing.name,
      description: input.description ?? existing.description,
      status:      input.status      ?? existing.status,
      updatedAt:   now,
    };

    const entityValidation = validateWorkspace(updated);
    if (!entityValidation.valid) {
      return validationError('WorkspaceService.updateWorkspace', entityValidation.errors);
    }

    const saved = await this.workspaces.update(updated);
    if (isDomainError(saved)) return saved;

    await this.activityService.recordActivity({
      workspaceId:   saved.id,
      performedBy,
      type:          ActivityType.WorkspaceUpdated,
      timestamp:     now,
      assignmentId:  null,
      contributorId: null,
      metadata:      {},
    });

    return saved;
  }

  async archiveWorkspace(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Workspace | AnyDomainError> {
    const existing = await this.workspaces.findById(id);
    if (isDomainError(existing)) return existing;
    if (existing === null) return notFound('Workspace', id);

    const now = new Date().toISOString();
    const archived: Workspace = {
      ...existing,
      status:    WorkspaceStatus.Archived,
      updatedAt: now,
    };

    const saved = await this.workspaces.update(archived);
    if (isDomainError(saved)) return saved;

    await this.activityService.recordActivity({
      workspaceId:   saved.id,
      performedBy,
      type:          ActivityType.WorkspaceArchived,
      timestamp:     now,
      assignmentId:  null,
      contributorId: null,
      metadata:      { workspaceName: saved.name },
    });

    return saved;
  }

  // ─── Read operations ────────────────────────────────────────────────────────

  async getWorkspaceById(
    id: EntityId,
  ): Promise<Workspace | null | AnyDomainError> {
    return this.workspaces.findById(id);
  }

  async getWorkspacesByOwner(
    ownerId: EntityId,
  ): Promise<Workspace[] | AnyDomainError> {
    return this.workspaces.findByOwner(ownerId);
  }

  async getAllWorkspaces(): Promise<Workspace[] | AnyDomainError> {
    return this.workspaces.findAll();
  }
}
