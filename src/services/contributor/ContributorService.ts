/**
 * ContributorService
 *
 * Implements IContributorService.
 * Manages Contributors within a Workspace.
 *
 * Responsibilities:
 * - Add Contributors to a Workspace (enforcing email uniqueness)
 * - Update Contributor profile information
 * - Archive Contributors (preserving all historical data)
 * - Record Activity events on successful mutations
 *
 * Not responsible for:
 * - Assignment management
 * - Role-based permission enforcement (deferred — see authorization note)
 * - Storage mechanics
 *
 * Authorization note:
 * - `performedBy` is accepted and stored as-is.
 * - Role enforcement (Owner for role changes, self for profile) will be
 *   introduced when identity management lands.
 *
 * @see src/services/contributor/IContributorService.ts
 * @see docs/04.5_permission_model.md (Contributor permissions)
 */

import type { IContributorService } from './IContributorService';
import type {
  IContributorRepository,
  Contributor,
  CreateContributorInput,
  UpdateContributorInput,
  AnyDomainError,
  EntityId,
} from '@domain';
import {
  validateContributor,
  validateCreateContributorInput,
  ContributorStatus,
  ActivityType,
  Authorization,
} from '@domain';
import type { IActivityService } from '../activity/IActivityService';
import { generateId } from '@lib';
import { isDomainError, validationError, notFound, conflict, permissionDenied } from '@lib/errors';

export class ContributorService implements IContributorService {
  constructor(
    private readonly contributors: IContributorRepository,
    private readonly activityService: IActivityService,
  ) {}

  // ─── Write operations ───────────────────────────────────────────────────────

  async addContributor(
    input: CreateContributorInput,
    performedBy: EntityId,
  ): Promise<Contributor | AnyDomainError> {
    const actor = await this.contributors.findById(performedBy);
    if (isDomainError(actor)) return actor;
    if (actor === null) return notFound('Contributor', performedBy);
    if (!Authorization.canArchiveContributor(actor.role)) {
      return permissionDenied('ContributorService.addContributor', `Role "${actor.role}" is not authorized.`);
    }

    const inputValidation = validateCreateContributorInput(input);
    if (!inputValidation.valid) {
      return validationError('ContributorService.addContributor', inputValidation.errors);
    }

    // Enforce email uniqueness within the Workspace
    const duplicate = await this.contributors.findByEmail(
      input.workspaceId,
      input.email,
    );
    if (isDomainError(duplicate)) return duplicate;
    if (duplicate !== null) {
      return conflict(
        `A Contributor with email "${input.email}" already exists in this Workspace.`,
      );
    }

    const now = new Date().toISOString();
    const contributor: Contributor = {
      id:          generateId(),
      createdAt:   now,
      updatedAt:   now,
      workspaceId: input.workspaceId,
      name:        input.name,
      email:       input.email,
      avatar:      input.avatar   ?? '',
      role:        input.role,
      joinedAt:    input.joinedAt ?? now,
      status:      input.status   ?? ContributorStatus.Active,
    };

    const entityValidation = validateContributor(contributor);
    if (!entityValidation.valid) {
      return validationError('ContributorService.addContributor', entityValidation.errors);
    }

    const saved = await this.contributors.create(contributor);
    if (isDomainError(saved)) return saved;

    await this.activityService.recordActivity({
      workspaceId:   saved.workspaceId,
      performedBy,
      type:          ActivityType.ContributorJoined,
      timestamp:     now,
      assignmentId:  null,
      contributorId: saved.id,
      metadata:      { contributorName: saved.name, role: saved.role },
    });

    return saved;
  }

  async updateContributor(
    id: EntityId,
    input: UpdateContributorInput,
    performedBy: EntityId,
  ): Promise<Contributor | AnyDomainError> {
    const existing = await this.contributors.findById(id);
    if (isDomainError(existing)) return existing;
    if (existing === null) return notFound('Contributor', id);

    // If email is changing, enforce uniqueness in the Workspace
    if (input.email !== undefined && input.email !== existing.email) {
      const duplicate = await this.contributors.findByEmail(
        existing.workspaceId,
        input.email,
      );
      if (isDomainError(duplicate)) return duplicate;
      if (duplicate !== null) {
        return conflict(
          `A Contributor with email "${input.email}" already exists in this Workspace.`,
        );
      }
    }

    const now = new Date().toISOString();
    const updated: Contributor = {
      ...existing,
      name:      input.name      ?? existing.name,
      email:     input.email     ?? existing.email,
      avatar:    input.avatar    ?? existing.avatar,
      role:      input.role      ?? existing.role,
      status:    input.status    ?? existing.status,
      updatedAt: now,
    };

    const entityValidation = validateContributor(updated);
    if (!entityValidation.valid) {
      return validationError('ContributorService.updateContributor', entityValidation.errors);
    }

    const saved = await this.contributors.update(updated);
    if (isDomainError(saved)) return saved;

    await this.activityService.recordActivity({
      workspaceId:   saved.workspaceId,
      performedBy,
      type:          ActivityType.ContributorUpdated,
      timestamp:     now,
      assignmentId:  null,
      contributorId: saved.id,
      metadata:      {},
    });

    return saved;
  }

  async archiveContributor(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Contributor | AnyDomainError> {
    const actor = await this.contributors.findById(performedBy);
    if (isDomainError(actor)) return actor;
    if (actor === null) return notFound('Contributor', performedBy);
    if (!Authorization.canArchiveContributor(actor.role)) {
      return permissionDenied('ContributorService.archiveContributor', `Role "${actor.role}" is not authorized.`);
    }

    const existing = await this.contributors.findById(id);
    if (isDomainError(existing)) return existing;
    if (existing === null) return notFound('Contributor', id);

    const now = new Date().toISOString();
    const archived: Contributor = {
      ...existing,
      status:    ContributorStatus.Archived,
      updatedAt: now,
    };

    const saved = await this.contributors.update(archived);
    if (isDomainError(saved)) return saved;

    await this.activityService.recordActivity({
      workspaceId:   saved.workspaceId,
      performedBy,
      type:          ActivityType.ContributorArchived,
      timestamp:     now,
      assignmentId:  null,
      contributorId: saved.id,
      metadata:      { contributorName: saved.name },
    });

    return saved;
  }

  // ─── Read operations ────────────────────────────────────────────────────────

  async getContributorById(
    id: EntityId,
  ): Promise<Contributor | null | AnyDomainError> {
    return this.contributors.findById(id);
  }

  async getContributorsByWorkspace(
    workspaceId: EntityId,
  ): Promise<Contributor[] | AnyDomainError> {
    return this.contributors.findByWorkspace(workspaceId);
  }
}
