/**
 * IAssignmentRepository
 *
 * Persistence contract for the Assignment entity.
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
 * - Assignments are historical records — they are archived, never deleted.
 *
 * @see docs/09_technical_architecture.md (Repository Pattern)
 * @see docs/02_domain_model.md (Assignment)
 * @see docs/04_assignment_lifecycle.md (Lifecycle Overview)
 */

import type { EntityId, AnyDomainError } from '../shared';
import type { AssignmentStatus } from '../shared/enums';
import type { Assignment } from './entity';

export interface IAssignmentRepository {
  /** Persists a new Assignment. The entity must have a valid id assigned by the service layer. */
  create(assignment: Assignment): Promise<Assignment | AnyDomainError>;

  /**
   * Persists changes to an existing Assignment (e.g. status transitions,
   * deadline changes, revisionCount increments). The entity must already exist.
   */
  update(assignment: Assignment): Promise<Assignment | AnyDomainError>;

  /** Returns the Assignment with the given id, or null if not found. */
  findById(id: EntityId): Promise<Assignment | null | AnyDomainError>;

  /** Returns all Assignments in the given Workspace. */
  findByWorkspace(workspaceId: EntityId): Promise<Assignment[] | AnyDomainError>;

  /** Returns all Assignments assigned to the given Contributor. */
  findByContributor(workspaceId: EntityId, contributorId: EntityId): Promise<Assignment[] | AnyDomainError>;

  /** Returns all Assignments belonging to the given Milestone. */
  findByMilestone(workspaceId: EntityId, milestoneId: EntityId): Promise<Assignment[] | AnyDomainError>;

  /** Returns all Assignments in the given Workspace with the given status. */
  findByStatus(workspaceId: EntityId, status: AssignmentStatus): Promise<Assignment[] | AnyDomainError>;

  /** Returns all Assignments assigned to the given Reviewer. */
  findByReviewer(workspaceId: EntityId, reviewerId: EntityId): Promise<Assignment[] | AnyDomainError>;

  /** Returns true if an Assignment with the given id exists. */
  exists(id: EntityId): Promise<boolean | AnyDomainError>;

  /** Permanently deletes the Assignment. */
  delete(id: EntityId): Promise<void | AnyDomainError>;
}
