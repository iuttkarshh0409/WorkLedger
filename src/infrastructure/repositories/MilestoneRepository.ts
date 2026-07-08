/**
 * MilestoneRepository
 *
 * Concrete implementation of IMilestoneRepository.
 * Persists Milestone entities using the injected IStorageProvider.
 *
 * Responsibilities:
 *   - Entity persistence and retrieval
 *   - Translation of StorageError → DomainError
 *
 * Not responsible for:
 *   - Date ordering validation (service responsibility)
 *   - Assignment grouping logic
 *   - Business rules
 *
 * @see src/domain/milestone/repository.ts (IMilestoneRepository)
 * @see docs/09_technical_architecture.md (Repository Pattern)
 */

import type { IMilestoneRepository } from '@domain';
import type { Milestone } from '@domain';
import type { AnyDomainError } from '@domain';
import type { EntityId } from '@domain';
import type { MilestoneStatus } from '@domain';
import type { IStorageProvider } from '../storage';
import { STORAGE_NAMESPACES } from './namespaces';
import { translateStorageError } from './translateStorageError';

type Res<T> = Promise<T | AnyDomainError>;

export class MilestoneRepository implements IMilestoneRepository {
  private readonly namespace = STORAGE_NAMESPACES.milestones;

  constructor(private readonly storage: IStorageProvider) {}

  // ─── Writes ────────────────────────────────────────────────────────────────

  async create(milestone: Milestone): Res<Milestone> {
    const result = await this.storage.set(
      this.namespace,
      milestone.id,
      milestone,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'MilestoneRepository.create');
    }
    return milestone;
  }

  async update(milestone: Milestone): Res<Milestone> {
    const result = await this.storage.set(
      this.namespace,
      milestone.id,
      milestone,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'MilestoneRepository.update');
    }
    return milestone;
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  async findById(id: EntityId): Res<Milestone | null> {
    const result = await this.storage.get<Milestone>(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'MilestoneRepository.findById');
    }
    return result.value;
  }

  async findByWorkspace(workspaceId: EntityId): Res<Milestone[]> {
    const result = await this.storage.list<Milestone>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'MilestoneRepository.findByWorkspace',
      );
    }
    return result.value.filter((m) => m.workspaceId === workspaceId);
  }

  async findByStatus(
    workspaceId: EntityId,
    status: MilestoneStatus,
  ): Res<Milestone[]> {
    const result = await this.storage.list<Milestone>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'MilestoneRepository.findByStatus',
      );
    }
    return result.value.filter(
      (m) => m.workspaceId === workspaceId && m.status === status,
    );
  }

  async exists(id: EntityId): Res<boolean> {
    const result = await this.storage.has(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'MilestoneRepository.exists');
    }
    return result.value;
  }
}
