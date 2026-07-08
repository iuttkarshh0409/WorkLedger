/**
 * IWorkspaceService
 *
 * Application-facing contract for Workspace operations.
 *
 * Responsibilities:
 * - Create and configure Workspaces
 * - Retrieve Workspaces for the UI
 * - Archive Workspaces (never delete — historical preservation)
 *
 * Rules:
 * - No repository types, storage types, or infrastructure imports
 * - No persistence logic
 * - Permission enforcement is the responsibility of this layer
 *
 * @see docs/04.5_permission_model.md (Workspace Owner permissions)
 * @see docs/09_technical_architecture.md (Application Layer)
 */

import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  AnyDomainError,
  EntityId,
} from '@domain';

export interface IWorkspaceService {
  // ─── Write operations ───────────────────────────────────────────────────────

  /**
   * Creates a new Workspace and records a WorkspaceCreated Activity.
   *
   * @permission Owner — implicitly granted as the creator becomes Owner
   */
  createWorkspace(
    input: CreateWorkspaceInput,
  ): Promise<Workspace | AnyDomainError>;

  /**
   * Updates mutable Workspace fields (name, description).
   *
   * @permission Owner only
   * @see docs/04.5_permission_model.md (Edit Workspace)
   */
  updateWorkspace(
    id: EntityId,
    input: UpdateWorkspaceInput,
    performedBy: EntityId,
  ): Promise<Workspace | AnyDomainError>;

  /**
   * Archives a Workspace. Archived Workspaces are preserved in full.
   * All members, assignments, reviews, and activities remain accessible.
   *
   * Archival is preferred over deletion to preserve historical integrity.
   *
   * @permission Owner only
   * @see docs/04.5_permission_model.md (Archive Workspace)
   */
  archiveWorkspace(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Workspace | AnyDomainError>;

  // ─── Read operations ────────────────────────────────────────────────────────

  /**
   * Returns the Workspace with the given id, or null if not found.
   */
  getWorkspaceById(
    id: EntityId,
  ): Promise<Workspace | null | AnyDomainError>;

  /**
   * Returns all Workspaces owned by the given user.
   */
  getWorkspacesByOwner(
    ownerId: EntityId,
  ): Promise<Workspace[] | AnyDomainError>;

  /**
   * Returns all Workspaces in the system.
   * Scoped globally — Workspace is the root entity.
   */
  getAllWorkspaces(): Promise<Workspace[] | AnyDomainError>;
}
