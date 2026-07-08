/**
 * IReviewRepository
 *
 * Persistence contract for the Review entity.
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
 * - Published Reviews are immutable. update() is admin-only — services
 *   must enforce authorisation and Activity logging before calling.
 *
 * @see docs/09_technical_architecture.md (Repository Pattern)
 * @see docs/02_domain_model.md (Review)
 * @see docs/04.5_permission_model.md (Review Permissions)
 */

import type { EntityId, AnyDomainError } from '../shared';
import type { Review } from './entity';

export interface IReviewRepository {
  /** Persists a new Review. The entity must have a valid id assigned by the service layer. */
  create(review: Review): Promise<Review | AnyDomainError>;

  /**
   * Persists an administrative correction to a published Review.
   * Services must enforce authorisation and Activity logging before calling.
   *
   * @see docs/04.5_permission_model.md (Administrative Corrections)
   */
  update(review: Review): Promise<Review | AnyDomainError>;

  /** Returns the Review with the given id, or null if not found. */
  findById(id: EntityId): Promise<Review | null | AnyDomainError>;

  /** Returns all Reviews for the given Assignment. */
  findByAssignment(assignmentId: EntityId): Promise<Review[] | AnyDomainError>;

  /** Returns the Review for the given Submission, or null if none exists. */
  findBySubmission(submissionId: EntityId): Promise<Review | null | AnyDomainError>;

  /** Returns all Reviews published by the given Reviewer. */
  findByReviewer(reviewerId: EntityId): Promise<Review[] | AnyDomainError>;

  /** Returns true if a Review with the given id exists. */
  exists(id: EntityId): Promise<boolean | AnyDomainError>;
}
