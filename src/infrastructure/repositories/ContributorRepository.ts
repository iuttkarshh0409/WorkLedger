/**
 * ContributorRepository
 *
 * Concrete implementation of IContributorRepository.
 * Persists Contributor entities using the injected IStorageProvider.
 *
 * Responsibilities:
 *   - Entity persistence and retrieval
 *   - Translation of StorageError → DomainError
 *
 * Not responsible for:
 *   - Email uniqueness enforcement (service responsibility)
 *   - Role or permission checks
 *   - Business rules
 *
 * @see src/domain/contributor/repository.ts (IContributorRepository)
 * @see docs/09_technical_architecture.md (Repository Pattern)
 */

import type { IContributorRepository } from '@domain';
import type { Contributor } from '@domain';
import type { AnyDomainError } from '@domain';
import type { EntityId } from '@domain';
import type { IStorageProvider } from '../storage';
import { STORAGE_NAMESPACES } from './namespaces';
import { translateStorageError } from './translateStorageError';

type Res<T> = Promise<T | AnyDomainError>;

export class ContributorRepository implements IContributorRepository {
  private readonly namespace = STORAGE_NAMESPACES.contributors;

  constructor(private readonly storage: IStorageProvider) {}

  // ─── Writes ────────────────────────────────────────────────────────────────

  async create(contributor: Contributor): Res<Contributor> {
    const result = await this.storage.set(
      this.namespace,
      contributor.id,
      contributor,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'ContributorRepository.create');
    }
    return contributor;
  }

  async update(contributor: Contributor): Res<Contributor> {
    const result = await this.storage.set(
      this.namespace,
      contributor.id,
      contributor,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'ContributorRepository.update');
    }
    return contributor;
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  async findById(id: EntityId): Res<Contributor | null> {
    const result = await this.storage.get<Contributor>(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'ContributorRepository.findById');
    }
    return result.value;
  }

  async findByWorkspace(workspaceId: EntityId): Res<Contributor[]> {
    const result = await this.storage.list<Contributor>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'ContributorRepository.findByWorkspace',
      );
    }
    return result.value.filter((c) => c.workspaceId === workspaceId);
  }

  async findByEmail(
    workspaceId: EntityId,
    email: string,
  ): Res<Contributor | null> {
    const result = await this.storage.list<Contributor>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'ContributorRepository.findByEmail',
      );
    }
    return (
      result.value.find(
        (c) =>
          c.workspaceId === workspaceId &&
          c.email.toLowerCase() === email.toLowerCase(),
      ) ?? null
    );
  }

  async exists(id: EntityId): Res<boolean> {
    const result = await this.storage.has(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'ContributorRepository.exists');
    }
    return result.value;
  }
}
