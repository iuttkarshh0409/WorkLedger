import { ContributorRole } from './enums';
import type { EntityId } from './types';
import type { Assignment } from '../assignment/entity';

export const Authorization = {
  canCreateAssignment(role: ContributorRole | string): boolean {
    return role === ContributorRole.Owner;
  },

  canEditAssignment(role: ContributorRole | string): boolean {
    return role === ContributorRole.Owner;
  },

  canArchiveAssignment(role: ContributorRole | string): boolean {
    return role === ContributorRole.Owner;
  },

  canSubmitWork(_role: ContributorRole | string, userId: EntityId, assignment: Assignment): boolean {
    // Only the assigned contributor can submit work
    return assignment.contributorId === userId;
  },

  canPublishReview(role: ContributorRole | string, userId: EntityId, assignment: Assignment): boolean {
    // Self-review prevention: cannot review own assignment
    if (assignment.contributorId === userId) {
      return false;
    }
    // Must be Owner or the assigned reviewer
    return role === ContributorRole.Owner || assignment.reviewerId === userId;
  },

  canRequestRevision(role: ContributorRole | string, userId: EntityId, assignment: Assignment): boolean {
    // Self-review prevention: cannot request revision on own assignment
    if (assignment.contributorId === userId) {
      return false;
    }
    // Must be Owner or the assigned reviewer
    return role === ContributorRole.Owner || assignment.reviewerId === userId;
  },

  canArchiveContributor(role: ContributorRole | string): boolean {
    return role === ContributorRole.Owner;
  },

  canAccessSettings(role: ContributorRole | string): boolean {
    return role === ContributorRole.Owner;
  },

  canManageMilestones(role: ContributorRole | string): boolean {
    return role === ContributorRole.Owner;
  },

  canViewAssignment(role: ContributorRole | string, userId: EntityId, assignment: Assignment): boolean {
    if (role === ContributorRole.Owner || role === ContributorRole.Reviewer) {
      return true;
    }
    return assignment.contributorId === userId;
  }
};
