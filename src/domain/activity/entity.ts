/**
 * Activity Entity
 *
 * An Activity records every significant event that occurs within a Workspace.
 * Activities are the raw material for Timelines, audit history, and analytics.
 *
 * Activities are append-only — they are never updated or deleted.
 * Each state transition in the Assignment lifecycle produces exactly one Activity.
 *
 * The `metadata` field carries event-specific contextual data.
 * Its shape varies by ActivityType and is defined by the service layer.
 *
 * @see 02_domain_model.md (Activity)
 * @see 03_data_schema.md (Activity Schema)
 * @see 04_assignment_lifecycle.md (Automatic System Actions)
 */

import type { EntityId, Timestamp } from '../shared/types';
import type { ActivityType } from '../shared/enums';

export interface Activity {
  readonly id: EntityId;
  readonly createdAt: Timestamp;

  /**
   * Activities are append-only. updatedAt is intentionally omitted —
   * an Activity record should never be modified after creation.
   */

  workspaceId: EntityId;

  /** The Assignment this Activity relates to, if applicable. */
  assignmentId: EntityId | null;

  /** The Contributor this Activity relates to, if applicable. */
  contributorId: EntityId | null;

  type: ActivityType;

  /** The EntityId of the user who performed the action. */
  performedBy: EntityId;

  timestamp: Timestamp;

  /**
   * metadata
   *
   * Arbitrary key-value pairs carrying event-specific context.
   * Shape is defined and validated by individual service operations.
   * The domain entity accepts any record to remain decoupled from
   * specific event implementations.
   *
   * TODO: Future improvement — replace with discriminated union:
   *
   *   type ActivityMetadata =
   *     | AssignmentCreatedMetadata
   *     | ReviewPublishedMetadata
   *     | SubmissionUploadedMetadata
   *     | ...
   *
   * This would provide compile-time safety for metadata shape based
   * on ActivityType while keeping the domain layer type-safe.
   */
  metadata: Record<string, unknown>;
}
