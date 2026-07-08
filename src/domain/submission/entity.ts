/**
 * Submission Entity
 *
 * A Submission is a Contributor's response to an Assignment.
 * An Assignment may accumulate multiple Submissions when revisions
 * are requested — each revision creates a new Submission record.
 *
 * Submissions are immutable historical records once they enter review.
 *
 * @see 02_domain_model.md (Submission)
 * @see 03_data_schema.md (Submission Schema, Attachment Schema)
 */

import type { EntityId, Timestamp } from '../shared/types';

// ─── Attachment ───────────────────────────────────────────────────────────────

/**
 * Attachment
 *
 * A file or link associated with a Submission.
 *
 * @see 03_data_schema.md (Attachment Schema)
 */
export interface Attachment {
  readonly id: EntityId;
  name: string;
  type: string;
  url: string;
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface Submission {
  readonly id: EntityId;
  readonly createdAt: Timestamp;
  updatedAt: Timestamp;

  assignmentId: EntityId;
  submittedOn: Timestamp;
  description: string;
  attachments: Attachment[];

  /** URL to a GitHub repository, if applicable. */
  githubRepository: string;

  /** URL to a specific pull request, if applicable. */
  pullRequest: string;

  /** URL to a live demo, if applicable. */
  demoLink: string;

  /** Freeform notes from the Contributor. */
  notes: string;
}
