export type EntityId = string;
export type Timestamp = string;

export enum WorkspaceStatus {
  Active = 'Active',
  Archived = 'Archived',
}

export enum ContributorStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Archived = 'Archived',
}

export enum ContributorRole {
  Owner = 'Owner',
  Reviewer = 'Reviewer',
  Contributor = 'Contributor',
  Observer = 'Observer',
}

export enum MilestoneStatus {
  Planned = 'Planned',
  Active = 'Active',
  Completed = 'Completed',
  Archived = 'Archived',
}

export enum AssignmentStatus {
  Draft = 'Draft',
  Assigned = 'Assigned',
  Accepted = 'Accepted',
  InProgress = 'In Progress',
  Submitted = 'Submitted',
  UnderReview = 'Under Review',
  RevisionRequested = 'Revision Requested',
  Resubmitted = 'Resubmitted',
  Completed = 'Completed',
  Archived = 'Archived',
}

export enum AssignmentPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical',
}

export enum ActivityType {
  WorkspaceCreated = 'Workspace Created',
  WorkspaceUpdated = 'Workspace Updated',
  WorkspaceArchived = 'Workspace Archived',
  ContributorJoined = 'Contributor Joined',
  ContributorUpdated = 'Contributor Updated',
  ContributorArchived = 'Contributor Archived',
  MilestoneCreated = 'Milestone Created',
  MilestoneUpdated = 'Milestone Updated',
  MilestoneCompleted = 'Milestone Completed',
  MilestoneArchived = 'Milestone Archived',
  AssignmentCreated = 'Assignment Created',
  AssignmentUpdated = 'Assignment Updated',
  AssignmentAccepted = 'Assignment Accepted',
  AssignmentCompleted = 'Assignment Completed',
  AssignmentArchived = 'Assignment Archived',
  DeadlineChanged = 'Deadline Changed',
  SubmissionUploaded = 'Submission Uploaded',
  ReviewPublished = 'Review Published',
  ReviewCorrected = 'Review Corrected',
  RevisionRequested = 'Revision Requested',
}

export interface Workspace {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt: Timestamp | null;
  archivedBy: EntityId | null;
  name: string;
  description: string;
  ownerId: EntityId;
  status: WorkspaceStatus;
  version: number;
}

export interface Contributor {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt: Timestamp | null;
  archivedBy: EntityId | null;
  workspaceId: EntityId;
  name: string;
  email: string;
  avatar: string;
  role: ContributorRole;
  joinedAt: Timestamp;
  status: ContributorStatus;
  version: number;
}

export interface Milestone {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt: Timestamp | null;
  archivedBy: EntityId | null;
  workspaceId: EntityId;
  title: string;
  description: string;
  startDate: Timestamp;
  deadline: Timestamp;
  status: MilestoneStatus;
  version: number;
}

export interface Assignment {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt: Timestamp | null;
  archivedBy: EntityId | null;
  workspaceId: EntityId;
  milestoneId: EntityId | null;
  contributorId: EntityId;
  reviewerId: EntityId | null;
  title: string;
  description: string;
  priority: AssignmentPriority;
  tags: string[];
  assignedOn: Timestamp;
  deadline: Timestamp;
  status: AssignmentStatus;
  revisionCount: number;
  version: number;
}

export interface Submission {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt: Timestamp | null;
  archivedBy: EntityId | null;
  assignmentId: EntityId;
  submittedOn: Timestamp;
  description: string;
  githubRepository: string;
  pullRequest: string;
  demoLink: string;
  notes: string;
}

export interface ReviewScores {
  technicalQuality: number;
  documentation: number;
  communication: number;
  ownership: number;
  problemSolving: number;
  timeliness: number;
}

export interface Review {
  id: EntityId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt: Timestamp | null;
  archivedBy: EntityId | null;
  assignmentId: EntityId;
  submissionId: EntityId;
  reviewedBy: EntityId;
  reviewedOn: Timestamp;
  scores: ReviewScores;
  strengths: string[];
  improvements: string[];
  feedback: string;
}

export interface Activity {
  id: EntityId;
  createdAt: Timestamp;
  workspaceId: EntityId;
  assignmentId: EntityId | null;
  contributorId: EntityId | null;
  reviewId: EntityId | null;
  submissionId: EntityId | null;
  type: ActivityType;
  performedBy: EntityId;
  timestamp: Timestamp;
  requestId: string;
  metadata: Record<string, unknown>;
}
