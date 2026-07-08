/**
 * Domain Enumerations
 *
 * Canonical enumeration values for the WorkLedger domain.
 *
 * Source of truth: 03_data_schema.md
 *
 * Rules:
 * - Values must match the schema documentation exactly.
 * - Do not introduce custom values without updating the domain model.
 * - All modules import enumerations from this file — never redefine locally.
 */

// ─── Assignment Status ────────────────────────────────────────────────────────
// @see 03_data_schema.md (Status Enumeration)
// @see 04_assignment_lifecycle.md (State Definitions)

export enum AssignmentStatus {
  Draft             = 'Draft',
  Assigned          = 'Assigned',
  Accepted          = 'Accepted',
  InProgress        = 'In Progress',
  Submitted         = 'Submitted',
  UnderReview       = 'Under Review',
  RevisionRequested = 'Revision Requested',
  Resubmitted       = 'Resubmitted',
  Completed         = 'Completed',
  Archived          = 'Archived',
}

// ─── Assignment Priority ──────────────────────────────────────────────────────
// @see 03_data_schema.md (Priority Enumeration)

export enum AssignmentPriority {
  Low      = 'Low',
  Medium   = 'Medium',
  High     = 'High',
  Critical = 'Critical',
}

// ─── Contributor Status ───────────────────────────────────────────────────────
// @see 03_data_schema.md (Contributor Status)

export enum ContributorStatus {
  Active   = 'Active',
  Inactive = 'Inactive',
  Archived = 'Archived',
}

// ─── Contributor Role ─────────────────────────────────────────────────────────
// @see 04.5_permission_model.md (Core Roles)

export enum ContributorRole {
  Owner       = 'Owner',
  Reviewer    = 'Reviewer',
  Contributor = 'Contributor',
  Observer    = 'Observer',
}

// ─── Milestone Status ─────────────────────────────────────────────────────────
// @see 03_data_schema.md (Milestone Status)

export enum MilestoneStatus {
  Planned   = 'Planned',
  Active    = 'Active',
  Completed = 'Completed',
  Archived  = 'Archived',
}

// ─── Workspace Status ─────────────────────────────────────────────────────────
// @see 03_data_schema.md (Workspace Schema)

export enum WorkspaceStatus {
  Active   = 'Active',
  Archived = 'Archived',
}

// ─── Review Score Scale ───────────────────────────────────────────────────────
// @see 03_data_schema.md (Review Scale)
// @see 05_scoring_engine.md (Score Scale)
//
// 0     = Not Evaluated
// 1–2   = Poor
// 3–4   = Needs Improvement
// 5–6   = Satisfactory
// 7–8   = Good
// 9–10  = Exceptional
//
// Represented as a branded numeric range rather than an enum so that
// integer values (0–10) can be used directly in arithmetic.
// The ReviewScore type enforces this range at the type level.

export const REVIEW_SCORE_MIN = 0;
export const REVIEW_SCORE_MAX = 10;

// ─── Activity Type ────────────────────────────────────────────────────────────
// @see 03_data_schema.md (Activity Schema — examples of activity types)
// @see 04_assignment_lifecycle.md (Automatic System Actions)

export enum ActivityType {
  // ─── Workspace ─────────────────────────────────────────────────────────────
  WorkspaceCreated     = 'Workspace Created',
  WorkspaceUpdated     = 'Workspace Updated',
  WorkspaceArchived    = 'Workspace Archived',

  // ─── Contributor ───────────────────────────────────────────────────────────
  ContributorJoined    = 'Contributor Joined',
  ContributorUpdated   = 'Contributor Updated',
  ContributorArchived  = 'Contributor Archived',

  // ─── Milestone ─────────────────────────────────────────────────────────────
  MilestoneCreated     = 'Milestone Created',
  MilestoneUpdated     = 'Milestone Updated',
  MilestoneCompleted   = 'Milestone Completed',
  MilestoneArchived    = 'Milestone Archived',

  // ─── Assignment ────────────────────────────────────────────────────────────
  AssignmentCreated    = 'Assignment Created',
  AssignmentUpdated    = 'Assignment Updated',
  AssignmentAccepted   = 'Assignment Accepted',
  AssignmentCompleted  = 'Assignment Completed',
  AssignmentArchived   = 'Assignment Archived',
  DeadlineChanged      = 'Deadline Changed',

  // ─── Submission ────────────────────────────────────────────────────────────
  SubmissionUploaded   = 'Submission Uploaded',

  // ─── Review ────────────────────────────────────────────────────────────────
  ReviewPublished      = 'Review Published',
  ReviewCorrected      = 'Review Corrected',
  RevisionRequested    = 'Revision Requested',
}
