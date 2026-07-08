/**
 * ActivityService
 *
 * Implements IActivityService.
 * Records workspace events and provides the Activity history used by
 * Timelines, audit views, and future analytics.
 *
 * Responsibilities:
 * - Persist Activity records via IActivityRepository
 * - Provide read access to Activity history
 *
 * Not responsible for:
 * - Deciding when Activities should be created (callers decide)
 * - Business workflow enforcement
 * - Permission checks
 *
 * Authorization note:
 * - `performedBy` is accepted and stored as-is.
 * - Role enforcement will be introduced when identity management lands.
 *
 * @see src/services/activity/IActivityService.ts
 * @see docs/04_assignment_lifecycle.md (Rule 5 — every transition generates an Activity)
 */

import type { IActivityService } from './IActivityService';
import type { IActivityRepository } from '@domain';
import type {
  Activity,
  ActivityType,
  CreateActivityInput,
  AnyDomainError,
  EntityId,
} from '@domain';
import { validateCreateActivityInput } from '@domain';
import { generateId } from '@lib';
import { validationError } from '@lib/errors';

export class ActivityService implements IActivityService {
  constructor(
    private readonly activities: IActivityRepository,
  ) {}

  // ─── Write operations ───────────────────────────────────────────────────────

  async recordActivity(
    input: CreateActivityInput,
  ): Promise<Activity | AnyDomainError> {
    const validation = validateCreateActivityInput(input);
    if (!validation.valid) {
      return validationError('ActivityService.recordActivity', validation.errors);
    }

    const now = new Date().toISOString();
    const activity: Activity = {
      id:            generateId(),
      createdAt:     now,
      workspaceId:   input.workspaceId,
      assignmentId:  input.assignmentId  ?? null,
      contributorId: input.contributorId ?? null,
      type:          input.type,
      performedBy:   input.performedBy,
      timestamp:     input.timestamp,
      metadata:      input.metadata ?? {},
    };

    return this.activities.create(activity);
  }

  // ─── Read operations ────────────────────────────────────────────────────────

  async getActivitiesByWorkspace(
    workspaceId: EntityId,
  ): Promise<Activity[] | AnyDomainError> {
    return this.activities.findByWorkspace(workspaceId);
  }

  async getActivitiesByAssignment(
    assignmentId: EntityId,
  ): Promise<Activity[] | AnyDomainError> {
    return this.activities.findByAssignment(assignmentId);
  }

  async getActivitiesByContributor(
    workspaceId: EntityId,
    contributorId: EntityId,
  ): Promise<Activity[] | AnyDomainError> {
    return this.activities.findByContributor(workspaceId, contributorId);
  }

  async getActivitiesByType(
    workspaceId: EntityId,
    type: ActivityType,
  ): Promise<Activity[] | AnyDomainError> {
    return this.activities.findByType(workspaceId, type);
  }
}
