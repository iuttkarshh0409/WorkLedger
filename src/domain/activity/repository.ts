/**
 * IActivityRepository
 *
 * Persistence contract for the Activity entity.
 *
 * The Domain Layer owns this interface.
 * The Infrastructure Layer provides the implementation.
 *
 * Return types:
 *   Every method returns Promise<T | AnyDomainError>.
 *   A DomainError result means the persistence operation failed.
 *   Callers (services) must handle errors explicitly.
 *
 * Rules:
 * - No knowledge of JSON, localStorage, databases, or APIs.
 * - No business logic. Repositories store and retrieve facts only.
 * - Activities are append-only — no update() or archive() exposed.
 *
 * @see docs/09_technical_architecture.md (Repository Pattern)
 * @see docs/02_domain_model.md (Activity)
 * @see docs/04_assignment_lifecycle.md (Automatic System Actions)
 */

import type { EntityId, AnyDomainError } from '../shared';
import type { ActivityType } from '../shared/enums';
import type { Activity } from './entity';

export interface IActivityRepository {
  /**
   * Records a new Activity. No update() or archive() — Activities are permanently immutable.
   * The entity must have a valid id assigned by the service layer.
   */
  create(activity: Activity): Promise<Activity | AnyDomainError>;

  /** Returns the Activity with the given id, or null if not found. */
  findById(id: EntityId): Promise<Activity | null | AnyDomainError>;

  /** Returns all Activities in the given Workspace, ordered by timestamp ascending. */
  findByWorkspace(workspaceId: EntityId): Promise<Activity[] | AnyDomainError>;

  /** Returns all Activities related to the given Assignment, ordered by timestamp ascending. */
  findByAssignment(assignmentId: EntityId): Promise<Activity[] | AnyDomainError>;

  /** Returns all Activities involving the given Contributor, ordered by timestamp ascending. */
  findByContributor(workspaceId: EntityId, contributorId: EntityId): Promise<Activity[] | AnyDomainError>;

  /** Returns all Activities of the given type in the given Workspace, ordered by timestamp ascending. */
  findByType(workspaceId: EntityId, type: ActivityType): Promise<Activity[] | AnyDomainError>;
}
