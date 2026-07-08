/**
 * MilestoneService
 *
 * Implements IMilestoneService.
 * Manages the Milestone lifecycle within a Workspace.
 *
 * Responsibilities:
 * - Create, update, complete, and archive Milestones
 * - Validate inputs before persistence
 * - Record Activity events on successful mutations
 *
 * Not responsible for:
 * - Assignment grouping logic
 * - Date ordering validation (structural validation only)
 * - Storage mechanics
 *
 * Authorization note:
 * - `performedBy` is accepted and stored as-is.
 * - Role enforcement will be introduced when identity management lands.
 *
 * Pipeline: Validate → Read → Business Rule → Persist → Record Activity → Return
 *
 * @see src/services/milestone/IMilestoneService.ts
 * @see docs/04.5_permission_model.md (Milestone permissions)
 */

import type { IMilestoneService } from './IMilestoneService';
import type {
  IMilestoneRepository,
  Milestone,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  MilestoneStatus,
  AnyDomainError,
  EntityId,
} from '@domain';
import {
  validateMilestone,
  validateCreateMilestoneInput,
  MilestoneStatus as Status,
  ActivityType,
} from '@domain';
import type { IActivityService } from '../activity/IActivityService';
import { generateId } from '@lib';
import { isDomainError, validationError, notFound, conflict } from '@lib/errors';

export class MilestoneService implements IMilestoneService {
  constructor(
    private readonly milestones: IMilestoneRepository,
    private readonly activityService: IActivityService,
  ) {}

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async fetch(id: EntityId): Promise<Milestone | AnyDomainError> {
    const result = await this.milestones.findById(id);
    if (isDomainError(result)) return result;
    if (result === null) return notFound('Milestone', id);
    return result;
  }

  private requireStatus(
    milestone: Milestone,
    ...allowed: Status[]
  ): AnyDomainError | null {
    if (!allowed.includes(milestone.status as Status)) {
      return conflict(
        `Milestone "${milestone.id}" is in status "${milestone.status}". ` +
        `Expected one of: ${allowed.join(', ')}.`,
      );
    }
    return null;
  }

  private async saveAndRecord(
    updated: Milestone,
    type: ActivityType,
    performedBy: EntityId,
    metadata: Record<string, unknown> = {},
  ): Promise<Milestone | AnyDomainError> {
    const saved = await this.milestones.update(updated);
    if (isDomainError(saved)) return saved;

    await this.activityService.recordActivity({
      workspaceId:   saved.workspaceId,
      performedBy,
      type,
      timestamp:     updated.updatedAt,
      assignmentId:  null,
      contributorId: null,
      metadata,
    });

    return saved;
  }

  // ─── Write operations ───────────────────────────────────────────────────────

  async createMilestone(
    input: CreateMilestoneInput,
    performedBy: EntityId,
  ): Promise<Milestone | AnyDomainError> {
    const inputValidation = validateCreateMilestoneInput(input);
    if (!inputValidation.valid) {
      return validationError('MilestoneService.createMilestone', inputValidation.errors);
    }

    const now = new Date().toISOString();
    const milestone: Milestone = {
      id:          generateId(),
      createdAt:   now,
      updatedAt:   now,
      workspaceId: input.workspaceId,
      title:       input.title,
      description: input.description ?? '',
      startDate:   input.startDate,
      deadline:    input.deadline,
      status:      input.status ?? Status.Planned,
    };

    const entityValidation = validateMilestone(milestone);
    if (!entityValidation.valid) {
      return validationError('MilestoneService.createMilestone', entityValidation.errors);
    }

    const saved = await this.milestones.create(milestone);
    if (isDomainError(saved)) return saved;

    await this.activityService.recordActivity({
      workspaceId:   saved.workspaceId,
      performedBy,
      type:          ActivityType.MilestoneCreated,
      timestamp:     now,
      assignmentId:  null,
      contributorId: null,
      metadata:      { title: saved.title },
    });

    return saved;
  }

  async updateMilestone(
    id: EntityId,
    input: UpdateMilestoneInput,
    performedBy: EntityId,
  ): Promise<Milestone | AnyDomainError> {
    const existing = await this.fetch(id);
    if (isDomainError(existing)) return existing;

    // Cannot update a Completed or Archived milestone
    const statusError = this.requireStatus(
      existing,
      Status.Planned,
      Status.Active,
    );
    if (statusError) return statusError;

    const now = new Date().toISOString();
    const updated: Milestone = {
      ...existing,
      title:       input.title       ?? existing.title,
      description: input.description ?? existing.description,
      startDate:   input.startDate   ?? existing.startDate,
      deadline:    input.deadline    ?? existing.deadline,
      status:      input.status      ?? existing.status,
      updatedAt:   now,
    };

    const entityValidation = validateMilestone(updated);
    if (!entityValidation.valid) {
      return validationError('MilestoneService.updateMilestone', entityValidation.errors);
    }

    return this.saveAndRecord(
      updated,
      ActivityType.MilestoneUpdated,
      performedBy,
      { title: updated.title },
    );
  }

  async completeMilestone(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Milestone | AnyDomainError> {
    // @permission Owner, Reviewer
    const existing = await this.fetch(id);
    if (isDomainError(existing)) return existing;

    const statusError = this.requireStatus(existing, Status.Planned, Status.Active);
    if (statusError) return statusError;

    const now = new Date().toISOString();
    const updated: Milestone = {
      ...existing,
      status:    Status.Completed,
      updatedAt: now,
    };

    return this.saveAndRecord(
      updated,
      ActivityType.MilestoneCompleted,
      performedBy,
      { title: updated.title },
    );
  }

  async archiveMilestone(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Milestone | AnyDomainError> {
    // @permission Owner only
    const existing = await this.fetch(id);
    if (isDomainError(existing)) return existing;

    const statusError = this.requireStatus(existing, Status.Completed);
    if (statusError) return statusError;

    const now = new Date().toISOString();
    const updated: Milestone = {
      ...existing,
      status:    Status.Archived,
      updatedAt: now,
    };

    return this.saveAndRecord(
      updated,
      ActivityType.MilestoneArchived,
      performedBy,
      { title: updated.title },
    );
  }

  // ─── Read operations ────────────────────────────────────────────────────────

  async getMilestoneById(
    id: EntityId,
  ): Promise<Milestone | null | AnyDomainError> {
    return this.milestones.findById(id);
  }

  async getMilestonesByWorkspace(
    workspaceId: EntityId,
  ): Promise<Milestone[] | AnyDomainError> {
    return this.milestones.findByWorkspace(workspaceId);
  }

  async getMilestonesByStatus(
    workspaceId: EntityId,
    status: MilestoneStatus,
  ): Promise<Milestone[] | AnyDomainError> {
    return this.milestones.findByStatus(workspaceId, status);
  }
}
