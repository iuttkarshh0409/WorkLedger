/**
 * IMilestoneRepository
 *
 * Persistence contract for the Milestone entity.
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
 * - Milestones belong to exactly one Workspace.
 *
 * @see docs/09_technical_architecture.md (Repository Pattern)
 * @see docs/02_domain_model.md (Milestone)
 */

import type { EntityId, AnyDomainError } from '../shared';
import type { MilestoneStatus } from '../shared/enums';
import type { Milestone } from './entity';

export interface IMilestoneRepository {
  /** Persists a new Milestone. The entity must have a valid id assigned by the service layer. */
  create(milestone: Milestone): Promise<Milestone | AnyDomainError>;

  /** Persists changes to an existing Milestone. The entity must already exist. */
  update(milestone: Milestone): Promise<Milestone | AnyDomainError>;

  /** Returns the Milestone with the given id, or null if not found. */
  findById(id: EntityId): Promise<Milestone | null | AnyDomainError>;

  /** Returns all Milestones in the given Workspace. */
  findByWorkspace(workspaceId: EntityId): Promise<Milestone[] | AnyDomainError>;

  /** Returns all Milestones in the given Workspace with the given status. */
  findByStatus(workspaceId: EntityId, status: MilestoneStatus): Promise<Milestone[] | AnyDomainError>;

  /** Returns true if a Milestone with the given id exists. */
  exists(id: EntityId): Promise<boolean | AnyDomainError>;
}
