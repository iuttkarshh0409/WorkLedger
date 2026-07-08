/**
 * ISubmissionService
 *
 * Application-facing contract for Submission operations.
 *
 * Responsibilities:
 * - Accept work submissions from Contributors
 * - Transition Assignment status upon submission
 * - Generate Activity records for submission events
 * - Retrieve Submission history for the UI
 *
 * Rules:
 * - No repository types, storage types, or infrastructure imports
 * - Each submission creates a new Submission record (revisions are additive)
 * - Submissions are immutable once they enter the review process
 * - Full revision history is always preserved
 *
 * @see docs/04_assignment_lifecycle.md (Submitted, Resubmitted)
 * @see docs/04.5_permission_model.md (Submission permissions)
 * @see docs/09_technical_architecture.md (Application Layer)
 */

import type {
  Submission,
  CreateSubmissionInput,
  AnyDomainError,
  EntityId,
} from '@domain';

export interface ISubmissionService {
  // ─── Write operations ───────────────────────────────────────────────────────

  /**
   * Submits work for an Assignment for the first time.
   *
   * This operation:
   * - Creates a new Submission record
   * - Transitions Assignment status to Submitted
   * - Records a SubmissionUploaded Activity
   *
   * @permission Contributor (assigned Contributor only)
   * @see docs/04_assignment_lifecycle.md (Submitted)
   * @see docs/04.5_permission_model.md (Submit Work)
   */
  submitWork(
    input: CreateSubmissionInput,
    performedBy: EntityId,
  ): Promise<Submission | AnyDomainError>;

  /**
   * Resubmits updated work after a revision has been requested.
   *
   * This operation:
   * - Creates a new Submission record (preserving prior submission)
   * - Transitions Assignment status to Resubmitted → Under Review
   * - Records a SubmissionUploaded Activity
   *
   * @permission Contributor (assigned Contributor only)
   * @see docs/04_assignment_lifecycle.md (Resubmitted)
   * @see docs/04.5_permission_model.md (Submit Work)
   */
  resubmitWork(
    input: CreateSubmissionInput,
    performedBy: EntityId,
  ): Promise<Submission | AnyDomainError>;

  // ─── Read operations ────────────────────────────────────────────────────────

  /**
   * Returns the Submission with the given id, or null if not found.
   */
  getSubmissionById(
    id: EntityId,
  ): Promise<Submission | null | AnyDomainError>;

  /**
   * Returns all Submissions for the given Assignment,
   * ordered by submittedOn ascending (oldest first).
   *
   * The full revision history is always available.
   */
  getSubmissionsByAssignment(
    assignmentId: EntityId,
  ): Promise<Submission[] | AnyDomainError>;

  /**
   * Returns the most recent Submission for the given Assignment,
   * or null if none exist.
   *
   * Used to identify the active Submission currently under review.
   */
  getLatestSubmission(
    assignmentId: EntityId,
  ): Promise<Submission | null | AnyDomainError>;
}
