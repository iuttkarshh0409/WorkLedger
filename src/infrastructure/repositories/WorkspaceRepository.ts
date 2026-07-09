/**
 * WorkspaceRepository
 *
 * Concrete implementation of IWorkspaceRepository.
 * Persists Workspace entities using the injected IStorageProvider.
 *
 * Responsibilities:
 *   - Entity persistence and retrieval
 *   - Translation of StorageError → DomainError
 *
 * Not responsible for:
 *   - Validation
 *   - Business rules
 *   - Permission checks
 *
 * @see src/domain/workspace/repository.ts (IWorkspaceRepository)
 * @see docs/09_technical_architecture.md (Repository Pattern)
 */

import type { IWorkspaceRepository } from '@domain';
import type { Workspace } from '@domain';
import type { AnyDomainError } from '@domain';
import type { EntityId } from '@domain';
import type { IStorageProvider } from '../storage';
import { STORAGE_NAMESPACES } from './namespaces';
import { translateStorageError } from './translateStorageError';

// ─── Result type ──────────────────────────────────────────────────────────────

type Res<T> = Promise<T | AnyDomainError>;

// ─── Repository ───────────────────────────────────────────────────────────────

export class WorkspaceRepository implements IWorkspaceRepository {
  private readonly namespace = STORAGE_NAMESPACES.workspaces;

  constructor(private readonly storage: IStorageProvider) {}

  // ─── Writes ────────────────────────────────────────────────────────────────

  async create(workspace: Workspace): Res<Workspace> {
    const result = await this.storage.set(
      this.namespace,
      workspace.id,
      workspace,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'WorkspaceRepository.create');
    }
    return workspace;
  }

  async update(workspace: Workspace): Res<Workspace> {
    const result = await this.storage.set(
      this.namespace,
      workspace.id,
      workspace,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'WorkspaceRepository.update');
    }
    return workspace;
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  async findById(id: EntityId): Res<Workspace | null> {
    const result = await this.storage.get<Workspace>(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'WorkspaceRepository.findById');
    }
    return result.value;
  }

  async findByOwner(ownerId: EntityId): Res<Workspace[]> {
    const result = await this.storage.list<Workspace>(this.namespace);
    if (!result.ok) {
      return translateStorageError(result.error, 'WorkspaceRepository.findByOwner');
    }
    return result.value.filter((w) => w.ownerId === ownerId);
  }

  async findAll(): Res<Workspace[]> {
    const result = await this.storage.list<Workspace>(this.namespace);
    if (!result.ok) {
      return translateStorageError(result.error, 'WorkspaceRepository.findAll');
    }
    return result.value;
  }

  async exists(id: EntityId): Res<boolean> {
    const result = await this.storage.has(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'WorkspaceRepository.exists');
    }
    return result.value;
  }

  async delete(id: EntityId): Res<void> {
    const result = await this.storage.remove(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'WorkspaceRepository.delete');
    }
  }
}
