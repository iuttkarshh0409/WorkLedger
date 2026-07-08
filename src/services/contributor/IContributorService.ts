/**
 * IContributorService
 *
 * Application-facing contract for Contributor operations.
 *
 * Responsibilities:
 * - Add Contributors to a Workspace
 * - Update Contributor profile information
 * - Archive Contributors who are no longer active
 * - Retrieve Contributors for the UI
 *
 * Rules:
 * - No repository types, storage types, or infrastructure imports
 * - Email uniqueness enforcement is the responsibility of this service
 * - Contributors are archived, never deleted — historical records are preserved
 *
 * @see docs/04.5_permission_model.md (Contributor permissions)
 * @see docs/09_technical_architecture.md (Application Layer)
 */

import type {
  Contributor,
  CreateContributorInput,
  UpdateContributorInput,
  AnyDomainError,
  EntityId,
} from '@domain';

export interface IContributorService {
  // ─── Write operations ───────────────────────────────────────────────────────

  /**
   * Adds a new Contributor to a Workspace.
   * Enforces unique email per Workspace.
   * Records a ContributorJoined Activity.
   *
   * @permission Owner, Reviewer
   * @see docs/04.5_permission_model.md (Invite Contributors)
   */
  addContributor(
    input: CreateContributorInput,
    performedBy: EntityId,
  ): Promise<Contributor | AnyDomainError>;

  /**
   * Updates mutable Contributor fields (name, email, avatar, role).
   *
   * @permission Owner (for role changes), Contributor (for own profile)
   * @see docs/04.5_permission_model.md (Manage Roles)
   */
  updateContributor(
    id: EntityId,
    input: UpdateContributorInput,
    performedBy: EntityId,
  ): Promise<Contributor | AnyDomainError>;

  /**
   * Archives a Contributor. Archived Contributors are preserved in full.
   * All their Assignments, Reviews, and Activities remain intact.
   *
   * Archival is preferred over removal to preserve historical integrity.
   *
   * @permission Owner only
   * @see docs/04.5_permission_model.md (Remove Contributors)
   */
  archiveContributor(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Contributor | AnyDomainError>;

  // ─── Read operations ────────────────────────────────────────────────────────

  /**
   * Returns the Contributor with the given id, or null if not found.
   */
  getContributorById(
    id: EntityId,
  ): Promise<Contributor | null | AnyDomainError>;

  /**
   * Returns all Contributors in the given Workspace.
   */
  getContributorsByWorkspace(
    workspaceId: EntityId,
  ): Promise<Contributor[] | AnyDomainError>;
}
