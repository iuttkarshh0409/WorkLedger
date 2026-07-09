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

// Repositories
export const workspaceCommand = new WorkspaceCommandRepository();
export const workspaceQuery = new WorkspaceQueryRepository();

export const contributorCommand = new ContributorCommandRepository();
export const contributorQuery = new ContributorQueryRepository();

export const milestoneCommand = new MilestoneCommandRepository();
export const milestoneQuery = new MilestoneQueryRepository();

export const assignmentCommand = new AssignmentCommandRepository();
export const assignmentQuery = new AssignmentQueryRepository();

export const submissionCommand = new SubmissionCommandRepository();
export const submissionQuery = new SubmissionQueryRepository();

export const reviewCommand = new ReviewCommandRepository();
export const reviewQuery = new ReviewQueryRepository();

export const activityCommand = new ActivityCommandRepository();
export const activityQuery = new ActivityQueryRepository();

// Services
export const activityService = new ActivityService(activityCommand, activityQuery);
export const workspaceService = new WorkspaceService(workspaceCommand, workspaceQuery, activityService);
export const contributorService = new ContributorService(contributorCommand, contributorQuery, activityService);
export const milestoneService = new MilestoneService(milestoneCommand, milestoneQuery, activityService);
export const assignmentService = new AssignmentService(assignmentCommand, assignmentQuery, activityService);
export const submissionService = new SubmissionService(submissionQuery, assignmentQuery);
export const reviewService = new ReviewService(reviewQuery, assignmentQuery);
