/**
 * SubmissionService
 *
 * Implements ISubmissionService.
 * Manages the Submission lifecycle and coordinates Assignment status transitions.
 *
 * Responsibilities:
 * - Create new Submission records for work delivery and revisions
 * - Transition Assignment status on submission events
 * - Preserve full submission history (append-only)
 * - Record Activity events on successful mutations
 *
 * Not responsible for:
 * - Review management (ReviewService)
 * - Score calculation
 * - Storage mechanics
 *
 * Authorization note:
 * - `performedBy` is accepted and stored as-is.
 * - Role enforcement (assigned Contributor only) will be introduced
 *   when identity management lands.
 *
 * Pipeline: Validate → Read → Business Rule → Persist → Transition → Record Activity → Return
 *
 * @see src/services/submission/ISubmissionService.ts
 * @see docs/04_assignment_lifecycle.md (Submitted, Resubmitted)
 * @see docs/04.5_permission_model.md (Submission permissions)
 */

import type { ISubmissionService } from './ISubmissionService';
import type {
  ISubmissionRepository,
  IAssignmentRepository,
  IContributorRepository,
  Submission,
  CreateSubmissionInput,
  AnyDomainError,
  EntityId,
} from '@domain';
import {
  validateSubmission,
  validateCreateSubmissionInput,
  AssignmentStatus,
  ActivityType,
  Authorization,
} from '@domain';
import type { IActivityService } from '../activity/IActivityService';
import { generateId } from '@lib';
import { isDomainError, validationError, notFound, conflict, permissionDenied } from '@lib/errors';

export class SubmissionService implements ISubmissionService {
  constructor(
    private readonly submissions: ISubmissionRepository,
    private readonly assignments: IAssignmentRepository,
    private readonly activityService: IActivityService,
    private readonly contributors?: IContributorRepository,
  ) {}

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Builds a new Submission entity from the provided input.
   */
  private buildSubmission(input: CreateSubmissionInput): Submission {
    const now = new Date().toISOString();
    return {
      id:               generateId(),
      createdAt:        now,
      updatedAt:        now,
      assignmentId:     input.assignmentId,
      submittedOn:      input.submittedOn,
      description:      input.description      ?? '',
      attachments:      input.attachments      ?? [],
      githubRepository: input.githubRepository ?? '',
      pullRequest:      input.pullRequest      ?? '',
      demoLink:         input.demoLink         ?? '',
      notes:            input.notes            ?? '',
    };
  }

  /**
   * Persists a Submission, then transitions the parent Assignment status,
   * and finally records an Activity. Rolls back (returns error) at any step.
   */
  private async persistAndTransition(
    submission: Submission,
    targetStatus: AssignmentStatus,
    performedBy: EntityId,
  ): Promise<Submission | AnyDomainError> {
    const saved = await this.submissions.create(submission);
    if (isDomainError(saved)) return saved;

    // Transition Assignment status after successful submission save
    const assignment = await this.assignments.findById(saved.assignmentId);
    if (isDomainError(assignment)) return assignment;
    if (assignment === null) return notFound('Assignment', saved.assignmentId);

    const now = new Date().toISOString();
    const transitioned = { ...assignment, status: targetStatus, updatedAt: now };
    const assignmentSaved = await this.assignments.update(transitioned);
    if (isDomainError(assignmentSaved)) return assignmentSaved;

    await this.activityService.recordActivity({
      workspaceId:   assignment.workspaceId,
      performedBy,
      type:          ActivityType.SubmissionUploaded,
      timestamp:     now,
      assignmentId:  assignment.id,
      contributorId: assignment.contributorId,
      metadata:      { submissionId: saved.id, revision: assignment.revisionCount },
    });

    return saved;
  }

  // ─── Write operations ───────────────────────────────────────────────────────

  async submitWork(
    input: CreateSubmissionInput,
    performedBy: EntityId,
  ): Promise<Submission | AnyDomainError> {
    const inputValidation = validateCreateSubmissionInput(input);
    if (!inputValidation.valid) {
      return validationError('SubmissionService.submitWork', inputValidation.errors);
    }

    // Assignment must exist and be In Progress to accept first submission
    const assignment = await this.assignments.findById(input.assignmentId);
    if (isDomainError(assignment)) return assignment;
    if (assignment === null) return notFound('Assignment', input.assignmentId);

    if (this.contributors) {
      const actor = await this.contributors.findById(performedBy);
      if (isDomainError(actor)) return actor;
      if (actor === null) return notFound('Contributor', performedBy);
      if (!Authorization.canSubmitWork(actor.role, performedBy, assignment)) {
        return permissionDenied('SubmissionService.submitWork', `User ${performedBy} is not authorized to submit this assignment.`);
      }
    }

    if (assignment.status !== AssignmentStatus.InProgress) {
      return conflict(
        `Assignment "${assignment.id}" must be In Progress to accept a submission. ` +
        `Current status: "${assignment.status}".`,
      );
    }

    const submission = this.buildSubmission(input);
    const entityValidation = validateSubmission(submission);
    if (!entityValidation.valid) {
      return validationError('SubmissionService.submitWork', entityValidation.errors);
    }

    return this.persistAndTransition(
      submission,
      AssignmentStatus.Submitted,
      performedBy,
    );
  }

  async resubmitWork(
    input: CreateSubmissionInput,
    performedBy: EntityId,
  ): Promise<Submission | AnyDomainError> {
    const inputValidation = validateCreateSubmissionInput(input);
    if (!inputValidation.valid) {
      return validationError('SubmissionService.resubmitWork', inputValidation.errors);
    }

    // Assignment must be in Revision Requested to accept a resubmission
    const assignment = await this.assignments.findById(input.assignmentId);
    if (isDomainError(assignment)) return assignment;
    if (assignment === null) return notFound('Assignment', input.assignmentId);

    if (this.contributors) {
      const actor = await this.contributors.findById(performedBy);
      if (isDomainError(actor)) return actor;
      if (actor === null) return notFound('Contributor', performedBy);
      if (!Authorization.canSubmitWork(actor.role, performedBy, assignment)) {
        return permissionDenied('SubmissionService.resubmitWork', `User ${performedBy} is not authorized to resubmit this assignment.`);
      }
    }

    if (assignment.status !== AssignmentStatus.RevisionRequested) {
      return conflict(
        `Assignment "${assignment.id}" must be in Revision Requested to accept a resubmission. ` +
        `Current status: "${assignment.status}".`,
      );
    }

    const submission = this.buildSubmission(input);
    const entityValidation = validateSubmission(submission);
    if (!entityValidation.valid) {
      return validationError('SubmissionService.resubmitWork', entityValidation.errors);
    }

    return this.persistAndTransition(
      submission,
      AssignmentStatus.UnderReview,
      performedBy,
    );
  }

  // ─── Read operations ────────────────────────────────────────────────────────

  async getSubmissionById(
    id: EntityId,
  ): Promise<Submission | null | AnyDomainError> {
    return this.submissions.findById(id);
  }

  async getSubmissionsByAssignment(
    assignmentId: EntityId,
  ): Promise<Submission[] | AnyDomainError> {
    return this.submissions.findByAssignment(assignmentId);
  }

  async getLatestSubmission(
    assignmentId: EntityId,
  ): Promise<Submission | null | AnyDomainError> {
    return this.submissions.findLatestByAssignment(assignmentId);
  }
}
