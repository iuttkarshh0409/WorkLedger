/**
 * AssignmentRepository
 *
 * Concrete implementation of IAssignmentRepository.
 * Persists Assignment entities using the injected IStorageProvider.
 *
 * Responsibilities:
 *   - Entity persistence and retrieval
 *   - Translation of StorageError → DomainError
 *
 * Not responsible for:
 *   - State transition validation (service responsibility)
 *   - Revision counting
 *   - Lifecycle enforcement
 *   - Business rules
 *
 * @see src/domain/assignment/repository.ts (IAssignmentRepository)
 * @see docs/04_assignment_lifecycle.md (Lifecycle — managed by services)
 * @see docs/09_technical_architecture.md (Repository Pattern)
 */

import type { IAssignmentRepository } from '@domain';
import type { Assignment } from '@domain';
import type { AnyDomainError } from '@domain';
import type { EntityId } from '@domain';
import type { AssignmentStatus } from '@domain';
import type { IStorageProvider } from '../storage';
import { STORAGE_NAMESPACES } from './namespaces';
import { translateStorageError } from './translateStorageError';

type Res<T> = Promise<T | AnyDomainError>;

export class AssignmentRepository implements IAssignmentRepository {
  private readonly namespace = STORAGE_NAMESPACES.assignments;

  constructor(private readonly storage: IStorageProvider) {}

  // ─── Writes ────────────────────────────────────────────────────────────────

  async create(assignment: Assignment): Res<Assignment> {
    const result = await this.storage.set(
      this.namespace,
      assignment.id,
      assignment,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'AssignmentRepository.create');
    }
    return assignment;
  }

  async update(assignment: Assignment): Res<Assignment> {
    const result = await this.storage.set(
      this.namespace,
      assignment.id,
      assignment,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'AssignmentRepository.update');
    }
    return assignment;
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  async findById(id: EntityId): Res<Assignment | null> {
    const result = await this.storage.get<Assignment>(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'AssignmentRepository.findById',
      );
    }
    return result.value;
  }

  async findByWorkspace(workspaceId: EntityId): Res<Assignment[]> {
    const result = await this.storage.list<Assignment>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'AssignmentRepository.findByWorkspace',
      );
    }
    return result.value.filter((a) => a.workspaceId === workspaceId);
  }

  async findByContributor(
    workspaceId: EntityId,
    contributorId: EntityId,
  ): Res<Assignment[]> {
    const result = await this.storage.list<Assignment>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'AssignmentRepository.findByContributor',
      );
    }
    return result.value.filter(
      (a) =>
        a.workspaceId === workspaceId && a.contributorId === contributorId,
    );
  }

  async findByMilestone(
    workspaceId: EntityId,
    milestoneId: EntityId,
  ): Res<Assignment[]> {
    const result = await this.storage.list<Assignment>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'AssignmentRepository.findByMilestone',
      );
    }
    return result.value.filter(
      (a) =>
        a.workspaceId === workspaceId && a.milestoneId === milestoneId,
    );
  }

  async findByStatus(
    workspaceId: EntityId,
    status: AssignmentStatus,
  ): Res<Assignment[]> {
    const result = await this.storage.list<Assignment>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'AssignmentRepository.findByStatus',
      );
    }
    return result.value.filter(
      (a) => a.workspaceId === workspaceId && a.status === status,
    );
  }

  async findByReviewer(
    workspaceId: EntityId,
    reviewerId: EntityId,
  ): Res<Assignment[]> {
    const result = await this.storage.list<Assignment>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'AssignmentRepository.findByReviewer',
      );
    }
    return result.value.filter(
      (a) => a.workspaceId === workspaceId && a.reviewerId === reviewerId,
    );
  }

  async exists(id: EntityId): Res<boolean> {
    const result = await this.storage.has(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'AssignmentRepository.exists');
    }
    return result.value;
  }
}
