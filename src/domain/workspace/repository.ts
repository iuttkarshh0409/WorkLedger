/**
 * IWorkspaceRepository
 *
 * Persistence contract for the Workspace entity.
 *
 * The Domain Layer owns this interface.
 * The Infrastructure Layer provides the implementation.
 *
 * Return types:
 *   Every method returns Promise<T | AnyDomainError>.
 *   A DomainError result means the persistence operation failed.
 *   A null result means the entity was not found (expected condition).
 *   Callers (services) must handle both cases explicitly.
 *
 * Rules:
 * - No knowledge of JSON, localStorage, databases, or APIs.
 * - No business logic. Repositories store and retrieve facts only.
 * - Workspace is the root entity — it is never deleted.
 *
 * @see docs/09_technical_architecture.md (Repository Pattern)
 * @see docs/02_domain_model.md (Workspace)
 */

import type { EntityId, AnyDomainError } from '../shared';
import type { Workspace } from './entity';

export interface IWorkspaceRepository {
  /** Persists a new Workspace. The entity must have a valid id assigned by the service layer. */
  create(workspace: Workspace): Promise<Workspace | AnyDomainError>;

  /** Persists changes to an existing Workspace. The entity must already exist. */
  update(workspace: Workspace): Promise<Workspace | AnyDomainError>;

  /** Returns the Workspace with the given id, or null if not found. */
  findById(id: EntityId): Promise<Workspace | null | AnyDomainError>;

  /** Returns all Workspaces owned by the given owner id. */
  findByOwner(ownerId: EntityId): Promise<Workspace[] | AnyDomainError>;

  /** Returns all Workspaces in the store. */
  findAll(): Promise<Workspace[] | AnyDomainError>;

  /** Returns true if a Workspace with the given id exists. */
  exists(id: EntityId): Promise<boolean | AnyDomainError>;
}
