import { ActivityCommandRepository, ActivityQueryRepository } from '../repositories/ActivityRepository.js';
import { Activity } from '../types/domain.js';
import { randomUUID } from 'crypto';

export class ActivityService {
  constructor(
    private readonly activityCommand: ActivityCommandRepository,
    private readonly activityQuery: ActivityQueryRepository
  ) {}

  async recordActivity(
    activityData: Omit<Activity, 'id' | 'createdAt' | 'requestId'>,
    requestId: string
  ): Promise<Activity> {
    const activity: Activity = {
      ...activityData,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      requestId,
    };
    await this.activityCommand.create(activity);
    return activity;
  }

  async getActivitiesForWorkspace(
    workspaceId: string,
    filters: { type?: any; performedBy?: string } = {},
    pagination: { page?: number; limit?: number } = {}
  ): Promise<{ items: Activity[]; totalCount: number }> {
    return this.activityQuery.findByWorkspace(workspaceId, filters, pagination);
  }
}
