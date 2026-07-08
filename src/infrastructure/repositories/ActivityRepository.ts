/**
 * ActivityRepository
 *
 * Concrete implementation of IActivityRepository.
 * Persists Activity entities using the injected IStorageProvider.
 *
 * Responsibilities:
 *   - Entity persistence and retrieval
 *   - Translation of StorageError → DomainError
 *
 * Not responsible for:
 *   - Business rules
 *   - Activity type validation
 *
 * Note: No update() or archive() — Activities are append-only.
 * This is enforced by the interface and reflects the documented model.
 *
 * @see src/domain/activity/repository.ts (IActivityRepository)
 * @see docs/04_assignment_lifecycle.md (Automatic System Actions)
 * @see docs/09_technical_architecture.md (Repository Pattern)
 */

import type { IActivityRepository } from '@domain';
import type { Activity } from '@domain';
import type { AnyDomainError } from '@domain';
import type { EntityId } from '@domain';
import type { ActivityType } from '@domain';
import type { IStorageProvider } from '../storage';
import { STORAGE_NAMESPACES } from './namespaces';
import { translateStorageError } from './translateStorageError';

type Res<T> = Promise<T | AnyDomainError>;

export class ActivityRepository implements IActivityRepository {
  private readonly namespace = STORAGE_NAMESPACES.activities;

  constructor(private readonly storage: IStorageProvider) {}

  // ─── Writes ────────────────────────────────────────────────────────────────

  async create(activity: Activity): Res<Activity> {
    const result = await this.storage.set(
      this.namespace,
      activity.id,
      activity,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'ActivityRepository.create');
    }
    return activity;
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  async findById(id: EntityId): Res<Activity | null> {
    const result = await this.storage.get<Activity>(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'ActivityRepository.findById');
    }
    return result.value;
  }

  async findByWorkspace(workspaceId: EntityId): Res<Activity[]> {
    const result = await this.storage.list<Activity>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'ActivityRepository.findByWorkspace',
      );
    }
    return this.sortByTimestamp(
      result.value.filter((a) => a.workspaceId === workspaceId),
    );
  }

  async findByAssignment(assignmentId: EntityId): Res<Activity[]> {
    const result = await this.storage.list<Activity>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'ActivityRepository.findByAssignment',
      );
    }
    return this.sortByTimestamp(
      result.value.filter((a) => a.assignmentId === assignmentId),
    );
  }

  async findByContributor(
    workspaceId: EntityId,
    contributorId: EntityId,
  ): Res<Activity[]> {
    const result = await this.storage.list<Activity>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'ActivityRepository.findByContributor',
      );
    }
    return this.sortByTimestamp(
      result.value.filter(
        (a) =>
          a.workspaceId === workspaceId &&
          a.contributorId === contributorId,
      ),
    );
  }

  async findByType(
    workspaceId: EntityId,
    type: ActivityType,
  ): Res<Activity[]> {
    const result = await this.storage.list<Activity>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'ActivityRepository.findByType',
      );
    }
    return this.sortByTimestamp(
      result.value.filter(
        (a) => a.workspaceId === workspaceId && a.type === type,
      ),
    );
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  /**
   * Sorts activities by timestamp ascending (oldest first).
   * ISO 8601 strings sort correctly with localeCompare.
   */
  private sortByTimestamp(activities: Activity[]): Activity[] {
    return [...activities].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp),
    );
  }
}
