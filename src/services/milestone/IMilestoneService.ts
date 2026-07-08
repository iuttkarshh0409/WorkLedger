/**
 * IMilestoneService
 *
 * Application-facing contract for Milestone operations.
 *
 * Responsibilities:
 * - Create and manage Milestones within a Workspace
 * - Progress Milestones through their lifecycle
 * - Retrieve Milestones for the UI
 *
 * Rules:
 * - No repository types, storage types, or infrastructure imports
 * - Milestone completion is the responsibility of this service,
 *   not the UI
 * - Milestones are archived, not deleted
 *
 * @see docs/04.5_permission_model.md (Milestone permissions)
 * @see docs/09_technical_architecture.md (Application Layer)
 */

import type {
  Milestone,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  MilestoneStatus,
  AnyDomainError,
  EntityId,
} from '@domain';

export interface IMilestoneService {
  // ─── Write operations ───────────────────────────────────────────────────────

  /**
   * Creates a new Milestone in the given Workspace.
   * Records a MilestoneCreated Activity.
   *
   * @permission Owner, Reviewer
   * @see docs/04.5_permission_model.md (Create Milestone)
   */
  createMilestone(
    input: CreateMilestoneInput,
    performedBy: EntityId,
  ): Promise<Milestone | AnyDomainError>;

  /**
   * Updates mutable Milestone fields (title, description, dates, status).
   *
   * @permission Owner, Reviewer
   * @see docs/04.5_permission_model.md (Edit Milestone)
   */
  updateMilestone(
    id: EntityId,
    input: UpdateMilestoneInput,
    performedBy: EntityId,
  ): Promise<Milestone | AnyDomainError>;

  /**
   * Marks a Milestone as Completed.
   * Records a MilestoneCompleted Activity.
   *
   * @permission Owner, Reviewer
   */
  completeMilestone(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Milestone | AnyDomainError>;

  /**
   * Archives a Milestone. Archived Milestones and their Assignments
   * are preserved in full.
   *
   * @permission Owner only
   */
  archiveMilestone(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Milestone | AnyDomainError>;

  // ─── Read operations ────────────────────────────────────────────────────────

  /**
   * Returns the Milestone with the given id, or null if not found.
   */
  getMilestoneById(
    id: EntityId,
  ): Promise<Milestone | null | AnyDomainError>;

  /**
   * Returns all Milestones in the given Workspace.
   */
  getMilestonesByWorkspace(
    workspaceId: EntityId,
  ): Promise<Milestone[] | AnyDomainError>;

  /**
   * Returns all Milestones in the given Workspace with the given status.
   */
  getMilestonesByStatus(
    workspaceId: EntityId,
    status: MilestoneStatus,
  ): Promise<Milestone[] | AnyDomainError>;
}
