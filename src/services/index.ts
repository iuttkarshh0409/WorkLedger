/**
 * Application Services
 *
 * Central barrel export for all service interfaces and implementations.
 *
 * Services define the application-facing API. They orchestrate repositories,
 * enforce business workflows, and remain completely independent of storage,
 * infrastructure, and UI concerns.
 *
 * All interfaces follow the union return type pattern documented in:
 *   docs/adr/ADR-001-repository-result-strategy.md
 *
 * Import from '@services' rather than deep paths where possible.
 *
 * @see docs/09_technical_architecture.md (Application Layer)
 */

// ─── Activity ─────────────────────────────────────────────────────────────────
export type { IActivityService }    from './activity';
export { ActivityService }          from './activity';

// ─── Workspace ────────────────────────────────────────────────────────────────
export type { IWorkspaceService }   from './workspace';
export { WorkspaceService }         from './workspace';

// ─── Contributor ──────────────────────────────────────────────────────────────
export type { IContributorService } from './contributor';
export { ContributorService }       from './contributor';

// ─── Milestone ────────────────────────────────────────────────────────────────
export type { IMilestoneService }   from './milestone';
export { MilestoneService }         from './milestone';

// ─── Assignment ───────────────────────────────────────────────────────────────
export type { IAssignmentService }  from './assignment';
export { AssignmentService }        from './assignment';

// ─── Submission ───────────────────────────────────────────────────────────────
export type { ISubmissionService }  from './submission';
export { SubmissionService }        from './submission';

// ─── Review ───────────────────────────────────────────────────────────────────
export type { IReviewService }      from './review';
export { ReviewService }            from './review';
