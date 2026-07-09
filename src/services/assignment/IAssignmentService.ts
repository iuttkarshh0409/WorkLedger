/**
 * IAssignmentService
 *
 * Application-facing contract for Assignment lifecycle operations.
 *
 * Each method corresponds to exactly one documented lifecycle transition.
 * No generic "update status" method exists — transitions are explicit
 * and self-documenting.
 *
 * Responsibilities:
 * - Enforce the documented Assignment lifecycle
 * - Validate transition preconditions
 * - Generate Activity records for every transition
 * - Enforce permission rules per transition
 *
 * Rules:
 * - No repository types, storage types, or infrastructure imports
 * - State transitions are irreversible (except archival)
 * - Every meaningful transition generates an Activity
 * - Assignments are archived, not deleted
 *
 * @see docs/04_assignment_lifecycle.md (Lifecycle Overview)
 * @see docs/04.5_permission_model.md (Assignment permissions)
 * @see docs/09_technical_architecture.md (Application Layer)
 */

import type {
  Assignment,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  AssignmentStatus,
  AnyDomainError,
  EntityId,
} from '@domain';

export interface IAssignmentService {
  // ─── Creation ───────────────────────────────────────────────────────────────

  /**
   * Creates a new Assignment in Draft status.
   * Records an AssignmentCreated Activity.
   *
   * @permission Owner, Reviewer
   * @see docs/04_assignment_lifecycle.md (Draft)
   * @see docs/04.5_permission_model.md (Create Assignment)
   */
  createAssignment(
    input: CreateAssignmentInput,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError>;

  /**
   * Updates mutable Assignment fields before acceptance.
   * Not permitted after the Contributor has accepted the Assignment.
   *
   * @permission Owner, Reviewer (subject to lifecycle constraints)
   * @see docs/04.5_permission_model.md (Edit Assignment)
   */
  updateAssignment(
    id: EntityId,
    input: UpdateAssignmentInput,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError>;

  // ─── Lifecycle transitions ──────────────────────────────────────────────────

  /**
   * Transitions: Draft → Assigned
   * Officially assigns the Assignment to the Contributor.
   * Records an AssignmentUpdated Activity.
   *
   * @permission Owner, Reviewer
   * @see docs/04_assignment_lifecycle.md (Assigned)
   */
  assignContributor(
    id: EntityId,
    contributorId: EntityId,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError>;

  /**
   * Transitions: Assigned → Accepted
   * The Contributor acknowledges responsibility for the Assignment.
   * Records an AssignmentAccepted Activity.
   *
   * @permission Contributor (assigned Contributor only)
   * @see docs/04_assignment_lifecycle.md (Accepted)
   * @see docs/04.5_permission_model.md (Accept Assignment)
   */
  acceptAssignment(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError>;

  /**
   * Transitions: Accepted → In Progress
   * The Contributor begins active work.
   * Records an AssignmentUpdated Activity.
   *
   * @permission Contributor (assigned Contributor only)
   * @see docs/04_assignment_lifecycle.md (In Progress)
   * @see docs/04.5_permission_model.md (Update Progress)
   */
  startAssignment(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError>;

  /**
   * Transitions: Completed → Archived
   * Archives the Assignment for historical preservation.
   * No further modifications are permitted after archival.
   *
   * @permission Owner only
   * @see docs/04_assignment_lifecycle.md (Archived)
   * @see docs/04.5_permission_model.md (Archive Assignment)
   */
  archiveAssignment(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError>;

  // ─── Read operations ────────────────────────────────────────────────────────

  /**
   * Returns the Assignment with the given id, or null if not found.
   */
  getAssignmentById(
    id: EntityId,
  ): Promise<Assignment | null | AnyDomainError>;

  /**
   * Returns all Assignments in the given Workspace.
   */
  getAssignmentsByWorkspace(
    workspaceId: EntityId,
  ): Promise<Assignment[] | AnyDomainError>;

  /**
   * Returns all Assignments assigned to the given Contributor.
   */
  getAssignmentsByContributor(
    workspaceId: EntityId,
    contributorId: EntityId,
  ): Promise<Assignment[] | AnyDomainError>;

  /**
   * Returns all Assignments belonging to the given Milestone.
   */
  getAssignmentsByMilestone(
    workspaceId: EntityId,
    milestoneId: EntityId,
  ): Promise<Assignment[] | AnyDomainError>;

  /**
   * Returns all Assignments in the given Workspace with the given status.
   */
  getAssignmentsByStatus(
    workspaceId: EntityId,
    status: AssignmentStatus,
  ): Promise<Assignment[] | AnyDomainError>;

  /**
   * Permanently deletes the Assignment with the given id.
   *
   * @permission Owner only
   */
  deleteAssignment(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<void | AnyDomainError>;
}
