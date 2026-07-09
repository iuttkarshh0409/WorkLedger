import { randomUUID } from 'crypto';
import { requestContextStorage } from '../middleware/context.js';
import { getEnv } from '../env.js';

import { WorkspaceCommandRepository, WorkspaceQueryRepository } from '../repositories/WorkspaceRepository.js';
import { ContributorCommandRepository, ContributorQueryRepository } from '../repositories/ContributorRepository.js';
import { MilestoneCommandRepository, MilestoneQueryRepository } from '../repositories/MilestoneRepository.js';
import { AssignmentCommandRepository, AssignmentQueryRepository } from '../repositories/AssignmentRepository.js';
import { SubmissionCommandRepository, SubmissionQueryRepository } from '../repositories/SubmissionRepository.js';
import { ReviewCommandRepository, ReviewQueryRepository } from '../repositories/ReviewRepository.js';
import { ActivityCommandRepository, ActivityQueryRepository } from '../repositories/ActivityRepository.js';

import { ActivityService } from './ActivityService.js';
import { WorkspaceService } from './WorkspaceService.js';
import { ContributorService } from './ContributorService.js';
import { MilestoneService } from './MilestoneService.js';
import { AssignmentService } from './AssignmentService.js';
import { SubmissionService } from './SubmissionService.js';
import { ReviewService } from './ReviewService.js';

function instrument<T extends object>(instance: T, className: string, stage: string): T {
  // If performance logging is disabled, return original immediately for near-zero overhead
  if (getEnv('PERFORMANCE_LOGGING') !== 'true') {
    return instance;
  }

  return new Proxy(instance, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);
      if (typeof originalValue === 'function') {
        return async function (this: any, ...args: any[]) {
          const store = requestContextStorage.getStore();
          const requestId = store?.requestId || 'system';
          const sessionId = store?.sessionId || 'system';
          
          const previousOperation = store?.currentOperation;
          if (store) {
            store.currentOperation = `${className}.${String(prop)}`;
          }

          const spanId = randomUUID();
          let parentId: string | null = null;
          if (store) {
            parentId = store.spanStack[store.spanStack.length - 1] || null;
            store.spanStack.push(spanId);
          }

          const start = performance.now();
          try {
            const result = await originalValue.apply(this, args);
            const durationMs = performance.now() - start;

            if (stage === 'Service' && store) {
              store.serviceFinishedAt = performance.now();
            }

            let rows: number | undefined;
            if (result !== undefined && result !== null) {
              if (Array.isArray(result)) {
                rows = result.length;
              } else if (typeof result === 'object') {
                if ('rows' in result && Array.isArray(result.rows)) {
                  rows = result.rows.length;
                } else if ('rowCount' in result && typeof result.rowCount === 'number') {
                  rows = result.rowCount;
                } else {
                  rows = 1;
                }
              }
            }

            const event = {
              id: randomUUID(),
              requestId,
              sessionId,
              spanId,
              parentId,
              timestamp: new Date().toISOString(),
              category: 'Performance',
              stage,
              operation: `${className}.${String(prop)}()`,
              durationMs,
              metadata: rows !== undefined ? { rows } : {},
            };

            if (store) {
              store.bufferedEvents.push(event);
            }

            return result;
          } catch (error) {
            const durationMs = performance.now() - start;
            const event = {
              id: randomUUID(),
              requestId,
              sessionId,
              spanId,
              parentId,
              timestamp: new Date().toISOString(),
              category: 'Performance',
              stage,
              operation: `${className}.${String(prop)}()`,
              durationMs,
              metadata: { error: String(error) },
            };

            if (store) {
              store.bufferedEvents.push(event);
            }
            throw error;
          } finally {
            if (store) {
              store.spanStack.pop();
              store.currentOperation = previousOperation;
            }
          }
        };
      }
      return originalValue;
    }
  });
}

// Repositories
export const workspaceCommand = instrument(new WorkspaceCommandRepository(), 'WorkspaceCommandRepository', 'Repository');
export const workspaceQuery = instrument(new WorkspaceQueryRepository(), 'WorkspaceQueryRepository', 'Repository');

export const contributorCommand = instrument(new ContributorCommandRepository(), 'ContributorCommandRepository', 'Repository');
export const contributorQuery = instrument(new ContributorQueryRepository(), 'ContributorQueryRepository', 'Repository');

export const milestoneCommand = instrument(new MilestoneCommandRepository(), 'MilestoneCommandRepository', 'Repository');
export const milestoneQuery = instrument(new MilestoneQueryRepository(), 'MilestoneQueryRepository', 'Repository');

export const assignmentCommand = instrument(new AssignmentCommandRepository(), 'AssignmentCommandRepository', 'Repository');
export const assignmentQuery = instrument(new AssignmentQueryRepository(), 'AssignmentQueryRepository', 'Repository');

export const submissionCommand = instrument(new SubmissionCommandRepository(), 'SubmissionCommandRepository', 'Repository');
export const submissionQuery = instrument(new SubmissionQueryRepository(), 'SubmissionQueryRepository', 'Repository');

export const reviewCommand = instrument(new ReviewCommandRepository(), 'ReviewCommandRepository', 'Repository');
export const reviewQuery = instrument(new ReviewQueryRepository(), 'ReviewQueryRepository', 'Repository');

export const activityCommand = instrument(new ActivityCommandRepository(), 'ActivityCommandRepository', 'Repository');
export const activityQuery = instrument(new ActivityQueryRepository(), 'ActivityQueryRepository', 'Repository');

// Services
export const activityService = instrument(new ActivityService(activityCommand, activityQuery), 'ActivityService', 'Service');
export const workspaceService = instrument(new WorkspaceService(workspaceCommand, workspaceQuery, activityService), 'WorkspaceService', 'Service');
export const contributorService = instrument(new ContributorService(contributorCommand, contributorQuery, activityService), 'ContributorService', 'Service');
export const milestoneService = instrument(new MilestoneService(milestoneCommand, milestoneQuery, activityService), 'MilestoneService', 'Service');
export const assignmentService = instrument(new AssignmentService(assignmentCommand, assignmentQuery, activityService), 'AssignmentService', 'Service');
export const submissionService = instrument(new SubmissionService(submissionQuery, assignmentQuery), 'SubmissionService', 'Service');
export const reviewService = instrument(new ReviewService(reviewQuery, assignmentQuery), 'ReviewService', 'Service');
