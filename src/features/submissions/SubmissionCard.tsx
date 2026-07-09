/**
 * SubmissionCard
 *
 * Displays a single Submission in the history list.
 * Stable layout — every field renders with a placeholder when unavailable.
 *
 * @see docs/02_domain_model.md (Submission)
 * @see docs/03_data_schema.md (Submission Schema)
 */

import { clsx } from 'clsx';
import type { Submission } from '@domain';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubmissionCardProps {
  submission:    Submission;
  revisionNumber: number;   // 1-based display index (1 = first, 2 = revision, etc.)
  isLatest:      boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SubmissionCard({
  submission,
  revisionNumber,
  isLatest,
}: SubmissionCardProps) {
  const hasLinks =
    submission.githubRepository ||
    submission.pullRequest ||
    submission.demoLink;

  return (
    <div className={clsx('card flex flex-col gap-3', !isLatest && 'opacity-70')}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">
            {revisionNumber === 1 ? 'Initial submission' : `Revision ${revisionNumber - 1}`}
          </span>
          {isLatest && (
            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20">
              Latest
            </span>
          )}
        </div>
        <time
          dateTime={submission.submittedOn}
          className="text-xs text-text-muted shrink-0"
        >
          {formatDate(submission.submittedOn)}
        </time>
      </div>

      {/* Description */}
      {submission.description ? (
        <p className="text-xs text-text-secondary leading-relaxed">
          {submission.description}
        </p>
      ) : (
        <p className="text-xs text-text-muted italic">No description provided.</p>
      )}

      {/* Links */}
      {hasLinks && (
        <div className="flex flex-wrap gap-3 pt-1 border-t border-border">
          {submission.githubRepository && (
            <a
              href={submission.githubRepository}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24"
                fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Repository
            </a>
          )}

          {submission.pullRequest && (
            <a
              href={submission.pullRequest}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true">
                <circle cx="18" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <path d="M13 6h3a2 2 0 0 1 2 2v7" />
                <line x1="6" y1="9" x2="6" y2="21" />
              </svg>
              Pull request
            </a>
          )}

          {submission.demoLink && (
            <a
              href={submission.demoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              Live demo
            </a>
          )}
        </div>
      )}

      {/* Attachments count */}
      {submission.attachments && submission.attachments.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width={12} height={12} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          {submission.attachments.length} attachment{submission.attachments.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Notes */}
      {submission.notes && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-text-muted mb-0.5 font-medium">Notes</p>
          <p className="text-xs text-text-secondary leading-relaxed">{submission.notes}</p>
        </div>
      )}
    </div>
  );
}
