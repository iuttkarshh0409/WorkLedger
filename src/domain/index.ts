/**
 * Domain Layer
 *
 * Central barrel export for the entire WorkLedger domain.
 *
 * Import from '@domain' rather than deep paths:
 *
 *   import type { Assignment } from '@domain';
 *   import type { IAssignmentRepository } from '@domain';
 *   import { validateReview } from '@domain';
 *
 * Modules exported:
 *   shared      — enumerations, primitive types, error types
 *   workspace   — Workspace entity + repository interface
 *   contributor — Contributor entity + repository interface
 *   milestone   — Milestone entity + repository interface
 *   assignment  — Assignment entity + repository interface
 *   submission  — Submission and Attachment entities + repository interface
 *   review      — Review entity and ReviewScores + repository interface
 *   activity    — Activity entity (append-only) + repository interface
 *
 * @see docs/09_technical_architecture.md (Domain Layer)
 * @see docs/03_data_schema.md (Canonical Data Model)
 */

// ─── Shared ───────────────────────────────────────────────────────────────────
export * from './shared';

// ─── Workspace ────────────────────────────────────────────────────────────────
export type { Workspace } from './workspace';
export type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from './workspace';
export {
  validateWorkspace,
  validateCreateWorkspaceInput,
} from './workspace';
export type { IWorkspaceRepository } from './workspace';

// ─── Contributor ──────────────────────────────────────────────────────────────
export type { Contributor } from './contributor';
export type {
  CreateContributorInput,
  UpdateContributorInput,
} from './contributor';
export {
  validateContributor,
  validateCreateContributorInput,
} from './contributor';
export type { IContributorRepository } from './contributor';

// ─── Milestone ────────────────────────────────────────────────────────────────
export type { Milestone } from './milestone';
export type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from './milestone';
export {
  validateMilestone,
  validateCreateMilestoneInput,
} from './milestone';
export type { IMilestoneRepository } from './milestone';

// ─── Assignment ───────────────────────────────────────────────────────────────
export type { Assignment } from './assignment';
export type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from './assignment';
export {
  validateAssignment,
  validateCreateAssignmentInput,
} from './assignment';
export type { IAssignmentRepository } from './assignment';

// ─── Submission ───────────────────────────────────────────────────────────────
export type { Submission, Attachment } from './submission';
export type {
  CreateSubmissionInput,
  UpdateSubmissionInput,
} from './submission';
export {
  validateAttachment,
  validateSubmission,
  validateCreateSubmissionInput,
} from './submission';
export type { ISubmissionRepository } from './submission';

// ─── Review ───────────────────────────────────────────────────────────────────
export type { Review, ReviewScores } from './review';
export type {
  CreateReviewInput,
  UpdateReviewInput,
} from './review';
export {
  validateReviewScores,
  validateReview,
  validateCreateReviewInput,
} from './review';
export type { IReviewRepository } from './review';

// ─── Activity ─────────────────────────────────────────────────────────────────
export type { Activity } from './activity';
export type { CreateActivityInput } from './activity';
export {
  validateActivity,
  validateCreateActivityInput,
} from './activity';
export type { IActivityRepository } from './activity';
