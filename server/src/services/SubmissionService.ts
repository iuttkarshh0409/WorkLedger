import { SubmissionQueryRepository } from '../repositories/SubmissionRepository.js';
import { AssignmentQueryRepository } from '../repositories/AssignmentRepository.js';
import { Submission, AssignmentStatus } from '../types/domain.js';
import { transaction } from '../db.js';
import { randomUUID } from 'crypto';

export class SubmissionService {
  constructor(
    private readonly submissionQuery: SubmissionQueryRepository,
    private readonly assignmentQuery: AssignmentQueryRepository
  ) {}

  async createSubmission(
    input: {
      assignmentId: string;
      description: string;
      githubRepository: string;
      pullRequest: string;
      demoLink: string;
      notes: string;
    },
    performedBy: string,
    requestId: string
  ): Promise<Submission> {
    if (!input.assignmentId || !input.description || !input.githubRepository || !input.pullRequest || !input.demoLink) {
      throw {
        status: 400,
        code: 'VALIDATION_ERROR',
        message: 'assignmentId, description, githubRepository, pullRequest, and demoLink are required.',
      };
    }

    const assignment = await this.assignmentQuery.findById(input.assignmentId);
    if (!assignment) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: `Assignment with id ${input.assignmentId} not found.`,
      };
    }

    const now = new Date().toISOString();
    const submissionId = randomUUID();
    const activityId = randomUUID();

    const submission: Submission = {
      id: submissionId,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
      archivedBy: null,
      assignmentId: input.assignmentId,
      submittedOn: now,
      description: input.description,
      githubRepository: input.githubRepository,
      pullRequest: input.pullRequest,
      demoLink: input.demoLink,
      notes: input.notes || '',
    };

    const targetStatus =
      assignment.status === AssignmentStatus.RevisionRequested
        ? AssignmentStatus.Resubmitted
        : AssignmentStatus.Submitted;

    await transaction(async (client) => {
      // 1. Insert Submission
      await client.query(
        `INSERT INTO submissions (id, created_at, updated_at, assignment_id, submitted_on, description, github_repository, pull_request, demo_link, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          submission.id,
          submission.createdAt,
          submission.updatedAt,
          submission.assignmentId,
          submission.submittedOn,
          submission.description,
          submission.githubRepository,
          submission.pullRequest,
          submission.demoLink,
          submission.notes,
        ]
      );

      // 2. Update Assignment status (and OCC check)
      const res = await client.query(
        `UPDATE assignments
         SET status = $1, version = version + 1, updated_at = NOW()
         WHERE id = $2 AND version = $3 AND archived_at IS NULL`,
        [targetStatus, assignment.id, assignment.version]
      );

      if (res.rowCount === 0) {
        throw {
          status: 409,
          code: 'RESOURCE_CONFLICT',
          message: 'Assignment was modified by another transaction.',
        };
      }

      // 3. Record Activity timeline event
      await client.query(
        `INSERT INTO activities (id, created_at, workspace_id, assignment_id, contributor_id, review_id, submission_id, type, performed_by, timestamp, request_id, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          activityId,
          now,
          assignment.workspaceId,
          assignment.id,
          assignment.contributorId,
          null,
          submission.id,
          'Submission Uploaded',
          performedBy,
          now,
          requestId,
          JSON.stringify({
            assignmentTitle: assignment.title,
            githubRepository: submission.githubRepository,
            pullRequest: submission.pullRequest,
          }),
        ]
      );
    });

    return submission;
  }

  async getSubmissionById(id: string): Promise<Submission> {
    const s = await this.submissionQuery.findById(id);
    if (!s) {
      throw {
        status: 404,
        code: 'NOT_FOUND',
        message: `Submission with id ${id} not found.`,
      };
    }
    return s;
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    return this.submissionQuery.findByAssignment(assignmentId);
  }
}
