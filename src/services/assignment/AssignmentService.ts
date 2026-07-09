/**
 * AssignmentService
 *
 * Implements IAssignmentService.
 * Manages the Assignment lifecycle from creation through archival.
 *
 * Responsibilities:
 * - Create Assignments and validate input
 * - Enforce documented lifecycle transitions
 * - Record Activity events after every successful transition
 * - Provide read access for workspace, contributor, milestone, and status queries
 *
 * Not responsible for:
 * - Submission management (SubmissionService)
 * - Review management (ReviewService)
 * - Storage mechanics
 *
 * Authorization note:
 * - `performedBy` is accepted and stored as-is.
 * - Role enforcement (e.g. only assigned Contributor can acceptAssignment)
 *   will be introduced when identity management lands.
 * - Each method documents the intended role constraint per
 *   docs/04.5_permission_model.md.
 *
 * Lifecycle transitions enforced here:
 *   createAssignment  → Draft
 *   assignContributor → Draft → Assigned
 *   acceptAssignment  → Assigned → Accepted
 *   startAssignment   → Accepted → In Progress
 *   archiveAssignment → Completed → Archived
 *
 * @see src/services/assignment/IAssignmentService.ts
 * @see docs/04_assignment_lifecycle.md
 * @see docs/04.5_permission_model.md
 */

import type { IAssignmentService } from './IAssignmentService';
import type {
  IAssignmentRepository,
  IContributorRepository,
  Assignment,
  CreateAssignmentInput,
  UpdateAssignmentInput,
  AssignmentStatus,
  AnyDomainError,
  EntityId,
} from '@domain';
import {
  validateAssignment,
  validateCreateAssignmentInput,
  AssignmentStatus as Status,
  AssignmentPriority,
  ActivityType,
  Authorization,
} from '@domain';
import type { IActivityService } from '../activity/IActivityService';
import { generateId } from '@lib';
import {
  isDomainError,
  validationError,
  notFound,
  conflict,
  permissionDenied,
} from '@lib/errors';

export class AssignmentService implements IAssignmentService {
  constructor(
    private readonly assignments: IAssignmentRepository,
    private readonly activityService: IActivityService,
    private readonly contributors?: IContributorRepository,
  ) {}

  // ─── Private helpers ────────────────────────────────────────────────────────

  /**
   * Asserts that the actor is an Owner.
   */
  private async checkOwner(performedBy: EntityId, action: string): Promise<AnyDomainError | null> {
    if (!this.contributors) return null;
    const actor = await this.contributors.findById(performedBy);
    if (isDomainError(actor)) return actor;
    if (actor === null) return notFound('Contributor', performedBy);
    if (!Authorization.canCreateAssignment(actor.role)) {
      return permissionDenied(action, `Role "${actor.role}" is not authorized.`);
    }
    return null;
  }

  /**
   * Fetches an Assignment by id and returns a NotFoundError if missing.
   */
  private async fetch(id: EntityId): Promise<Assignment | AnyDomainError> {
    const result = await this.assignments.findById(id);
    if (isDomainError(result)) return result;
    if (result === null) return notFound('Assignment', id);
    return result;
  }

  /**
   * Asserts that the Assignment is currently in one of the allowed statuses.
   * Returns a ConflictError if the transition is not permitted.
   */
  private requireStatus(
    assignment: Assignment,
    ...allowed: Status[]
  ): AnyDomainError | null {
    if (!allowed.includes(assignment.status as Status)) {
      return conflict(
        `Assignment "${assignment.id}" is in status "${assignment.status}". ` +
        `Expected one of: ${allowed.join(', ')}.`,
      );
    }
    return null;
  }

  /**
   * Persists an updated Assignment and records the associated Activity.
   * Only records the Activity after a successful save.
   */
  private async saveAndRecord(
    updated: Assignment,
    type: ActivityType,
    performedBy: EntityId,
    metadata: Record<string, unknown> = {},
  ): Promise<Assignment | AnyDomainError> {
    const saved = await this.assignments.update(updated);
    if (isDomainError(saved)) return saved;

    await this.activityService.recordActivity({
      workspaceId:   saved.workspaceId,
      performedBy,
      type,
      timestamp:     updated.updatedAt,
      assignmentId:  saved.id,
      contributorId: saved.contributorId,
      metadata,
    });

    return saved;
  }

  // ─── Creation ───────────────────────────────────────────────────────────────

  async createAssignment(
    input: CreateAssignmentInput,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError> {
    const authError = await this.checkOwner(performedBy, 'AssignmentService.createAssignment');
    if (authError) return authError;

    const inputValidation = validateCreateAssignmentInput(input);
    if (!inputValidation.valid) {
      return validationError('AssignmentService.createAssignment', inputValidation.errors);
    }

    const now = new Date().toISOString();
    const isHist = !!input.isHistorical;
    const histCreated = input.createdAt || input.assignedOn;
    
    const assignment: Assignment = {
      id:            generateId(),
      createdAt:     isHist ? histCreated : now,
      updatedAt:     isHist ? histCreated : now,
      workspaceId:   input.workspaceId,
      milestoneId:   input.milestoneId  ?? null,
      contributorId: input.contributorId,
      reviewerId:    input.reviewerId ?? null,
      title:         input.title,
      description:   input.description  ?? '',
      priority:      input.priority     ?? AssignmentPriority.Medium,
      tags:          input.tags         ?? [],
      assignedOn:    input.assignedOn,
      deadline:      input.deadline,
      status:        isHist && input.status ? input.status : Status.Draft,
      revisionCount: 0,
    };

    const entityValidation = validateAssignment(assignment);
    if (!entityValidation.valid) {
      return validationError('AssignmentService.createAssignment', entityValidation.errors);
    }

    const saved = await this.assignments.create(assignment);
    if (isDomainError(saved)) return saved;

    await this.activityService.recordActivity({
      workspaceId:   saved.workspaceId,
      performedBy,
      type:          ActivityType.AssignmentCreated,
      timestamp:     isHist ? histCreated : now,
      assignmentId:  saved.id,
      contributorId: saved.contributorId,
      metadata:      {
        title: saved.title,
        priority: saved.priority,
        ...(isHist ? { isHistorical: true, enteredOn: input.enteredOn || now.split('T')[0] } : {})
      },
    });

    return saved;
  }

  async updateAssignment(
    id: EntityId,
    input: UpdateAssignmentInput,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError> {
    const authError = await this.checkOwner(performedBy, 'AssignmentService.updateAssignment');
    if (authError) return authError;

    const existing = await this.fetch(id);
    if (isDomainError(existing)) return existing;

    // Updates are not permitted after the Contributor has accepted
    const statusError = this.requireStatus(
      existing,
      Status.Draft,
      Status.Assigned,
    );
    if (statusError) return statusError;

    const now = new Date().toISOString();
    const updated: Assignment = {
      ...existing,
      milestoneId:   input.milestoneId   !== undefined ? input.milestoneId   : existing.milestoneId,
      contributorId: input.contributorId ?? existing.contributorId,
      reviewerId:    input.reviewerId    !== undefined ? input.reviewerId    : existing.reviewerId,
      title:         input.title         ?? existing.title,
      description:   input.description   ?? existing.description,
      priority:      input.priority      ?? existing.priority,
      tags:          input.tags          ?? existing.tags,
      deadline:      input.deadline      ?? existing.deadline,
      updatedAt:     now,
    };

    const entityValidation = validateAssignment(updated);
    if (!entityValidation.valid) {
      return validationError('AssignmentService.updateAssignment', entityValidation.errors);
    }

    return this.saveAndRecord(
      updated,
      ActivityType.AssignmentUpdated,
      performedBy,
      { title: updated.title },
    );
  }

  // ─── Lifecycle transitions ──────────────────────────────────────────────────

  async assignContributor(
    id: EntityId,
    contributorId: EntityId,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError> {
    // @permission Owner, Reviewer
    const existing = await this.fetch(id);
    if (isDomainError(existing)) return existing;

    const statusError = this.requireStatus(existing, Status.Draft);
    if (statusError) return statusError;

    const now = new Date().toISOString();
    const updated: Assignment = {
      ...existing,
      contributorId,
      status:    Status.Assigned,
      updatedAt: now,
    };

    return this.saveAndRecord(
      updated,
      ActivityType.AssignmentUpdated,
      performedBy,
      { contributorId },
    );
  }

  async acceptAssignment(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError> {
    // @permission Contributor (assigned Contributor only)
    const existing = await this.fetch(id);
    if (isDomainError(existing)) return existing;

    const statusError = this.requireStatus(existing, Status.Assigned);
    if (statusError) return statusError;

    const now = new Date().toISOString();
    const updated: Assignment = {
      ...existing,
      status:    Status.Accepted,
      updatedAt: now,
    };

    return this.saveAndRecord(
      updated,
      ActivityType.AssignmentAccepted,
      performedBy,
    );
  }

  async startAssignment(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError> {
    // @permission Contributor (assigned Contributor only)
    const existing = await this.fetch(id);
    if (isDomainError(existing)) return existing;

    const statusError = this.requireStatus(existing, Status.Accepted);
    if (statusError) return statusError;

    const now = new Date().toISOString();
    const updated: Assignment = {
      ...existing,
      status:    Status.InProgress,
      updatedAt: now,
    };

    return this.saveAndRecord(
      updated,
      ActivityType.AssignmentUpdated,
      performedBy,
    );
  }

  async archiveAssignment(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<Assignment | AnyDomainError> {
    // @permission Owner only
    const authError = await this.checkOwner(performedBy, 'AssignmentService.archiveAssignment');
    if (authError) return authError;

    const existing = await this.fetch(id);
    if (isDomainError(existing)) return existing;

    const statusError = this.requireStatus(existing, Status.Completed);
    if (statusError) return statusError;

    const now = new Date().toISOString();
    const updated: Assignment = {
      ...existing,
      status:    Status.Archived,
      updatedAt: now,
    };

    return this.saveAndRecord(
      updated,
      ActivityType.AssignmentArchived,
      performedBy,
    );
  }

  // ─── Read operations ────────────────────────────────────────────────────────

  async getAssignmentById(
    id: EntityId,
  ): Promise<Assignment | null | AnyDomainError> {
    return this.assignments.findById(id);
  }

  async getAssignmentsByWorkspace(
    workspaceId: EntityId,
  ): Promise<Assignment[] | AnyDomainError> {
    return this.assignments.findByWorkspace(workspaceId);
  }

  async getAssignmentsByContributor(
    workspaceId: EntityId,
    contributorId: EntityId,
  ): Promise<Assignment[] | AnyDomainError> {
    return this.assignments.findByContributor(workspaceId, contributorId);
  }

  async getAssignmentsByMilestone(
    workspaceId: EntityId,
    milestoneId: EntityId,
  ): Promise<Assignment[] | AnyDomainError> {
    return this.assignments.findByMilestone(workspaceId, milestoneId);
  }

  async getAssignmentsByStatus(
    workspaceId: EntityId,
    status: AssignmentStatus,
  ): Promise<Assignment[] | AnyDomainError> {
    return this.assignments.findByStatus(workspaceId, status);
  }

  async deleteAssignment(
    id: EntityId,
    performedBy: EntityId,
  ): Promise<void | AnyDomainError> {
    const authError = await this.checkOwner(performedBy, 'AssignmentService.deleteAssignment');
    if (authError) return authError;

    const existing = await this.fetch(id);
    if (isDomainError(existing)) return existing;

    if (existing.status === Status.Completed) {
      return conflict('Completed assignments cannot be deleted. Archive them instead.');
    }

    const deleteResult = await this.assignments.delete(id);
    if (isDomainError(deleteResult)) return deleteResult;
  }
}
