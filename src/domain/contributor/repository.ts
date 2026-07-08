/**
 * IContributorRepository
 *
 * Persistence contract for the Contributor entity.
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
 * - Contributors belong to exactly one Workspace.
 *
 * @see docs/09_technical_architecture.md (Repository Pattern)
 * @see docs/02_domain_model.md (Contributor)
 */

import type { EntityId, AnyDomainError } from '../shared';
import type { Contributor } from './entity';

export interface IContributorRepository {
  /** Persists a new Contributor. The entity must have a valid id assigned by the service layer. */
  create(contributor: Contributor): Promise<Contributor | AnyDomainError>;

  /** Persists changes to an existing Contributor. The entity must already exist. */
  update(contributor: Contributor): Promise<Contributor | AnyDomainError>;

  /** Returns the Contributor with the given id, or null if not found. */
  findById(id: EntityId): Promise<Contributor | null | AnyDomainError>;

  /** Returns all Contributors in the given Workspace. */
  findByWorkspace(workspaceId: EntityId): Promise<Contributor[] | AnyDomainError>;

  /**
   * Returns the Contributor with the given email in the given Workspace,
   * or null if not found. Used to enforce unique email per Workspace.
   */
  findByEmail(workspaceId: EntityId, email: string): Promise<Contributor | null | AnyDomainError>;

  /** Returns true if a Contributor with the given id exists. */
  exists(id: EntityId): Promise<boolean | AnyDomainError>;
}
