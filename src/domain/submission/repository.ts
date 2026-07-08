/**
 * ISubmissionRepository
 *
 * Persistence contract for the Submission entity.
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
 * - Each revision creates a new Submission record — no update() exposed.
 *
 * @see docs/09_technical_architecture.md (Repository Pattern)
 * @see docs/02_domain_model.md (Submission)
 * @see docs/04_assignment_lifecycle.md (Revision Requested)
 */

import type { EntityId, AnyDomainError } from '../shared';
import type { Submission } from './entity';

export interface ISubmissionRepository {
  /**
   * Persists a new Submission. No update() — each revision is a new record.
   * The entity must have a valid id assigned by the service layer.
   */
  create(submission: Submission): Promise<Submission | AnyDomainError>;

  /** Returns the Submission with the given id, or null if not found. */
  findById(id: EntityId): Promise<Submission | null | AnyDomainError>;

  /**
   * Returns all Submissions for the given Assignment,
   * ordered by submittedOn ascending (oldest first).
   */
  findByAssignment(assignmentId: EntityId): Promise<Submission[] | AnyDomainError>;

  /**
   * Returns the most recent Submission for the given Assignment,
   * or null if none exist.
   */
  findLatestByAssignment(assignmentId: EntityId): Promise<Submission | null | AnyDomainError>;

  /** Returns true if a Submission with the given id exists. */
  exists(id: EntityId): Promise<boolean | AnyDomainError>;
}
