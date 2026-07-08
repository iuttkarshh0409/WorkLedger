/**
 * ContributorCard
 *
 * Displays a single Contributor in the list.
 *
 * Layout is always stable — every field renders with a placeholder when
 * the value is unavailable, preserving consistent visual rhythm across cards.
 *
 * @see docs/06_ui_architecture.md (Contributors page — card fields)
 * @see docs/07_design_system.md (Information-first, calm, structured)
 */

import { useState } from 'react';
import { clsx } from 'clsx';
import type { Contributor } from '@domain';
import { ContributorRole, ContributorStatus } from '@domain';
import { ConfirmDialog } from '@shared/components/ConfirmDialog';
import { Link } from 'react-router-dom';
import { contributorProfilePath } from '@shared/constants/routes';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleLabel(role: ContributorRole): string {
  return role;
}

function statusConfig(status: ContributorStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case ContributorStatus.Active:
      return { label: 'Active',   className: 'bg-green-50 text-green-700 ring-green-600/20' };
    case ContributorStatus.Inactive:
      return { label: 'Inactive', className: 'bg-surface-muted text-text-secondary ring-border' };
    case ContributorStatus.Archived:
      return { label: 'Archived', className: 'bg-surface-muted text-text-muted ring-border' };
  }
}

/** Derives initials from a name for the avatar fallback. */
function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContributorCardProps {
  contributor: Contributor;
  onArchive:  (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContributorCard({ contributor, onArchive }: ContributorCardProps) {
  const status   = statusConfig(contributor.status);
  const isActive = contributor.status !== ContributorStatus.Archived;
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div
      className={clsx(
        'card flex items-start gap-4',
        !isActive && 'opacity-60',
      )}
    >
      {/* Avatar */}
      <div
        aria-hidden="true"
        className="flex items-center justify-center w-10 h-10 rounded-full bg-accent-subtle text-accent text-sm font-semibold shrink-0 select-none"
      >
        {contributor.avatar ? (
          <img
            src={contributor.avatar}
            alt={`${contributor.name} avatar`}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          initials(contributor.name) || '—'
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Name + status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to={contributorProfilePath(contributor.id)}
            className="text-sm font-semibold text-text-primary hover:text-accent hover:underline truncate"
          >
            {contributor.name || '—'}
          </Link>
          <span
            className={clsx(
              'inline-flex items-center rounded-md px-2 py-0.5',
              'text-xs font-medium ring-1 ring-inset',
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>

        {/* Email */}
        <p className="text-xs text-text-secondary truncate mt-0.5">
          {contributor.email || <span className="text-text-muted">No email</span>}
        </p>

        {/* Role + joined date */}
        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
          <span>{roleLabel(contributor.role)}</span>
          <span aria-hidden="true">·</span>
          <span>
            Joined{' '}
            {contributor.joinedAt
              ? new Date(contributor.joinedAt).toLocaleDateString('en-US', {
                  year:  'numeric',
                  month: 'short',
                  day:   'numeric',
                })
              : '—'}
          </span>
        </div>
      </div>

      {/* Actions */}
      {isActive && (
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label={`Archive ${contributor.name}`}
            className={clsx(
              'text-xs text-text-muted hover:text-danger',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            Archive
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Archive contributor"
        message={`${contributor.name} will be archived. All their assignments, reviews, and activity are preserved.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() => { setConfirmOpen(false); onArchive(contributor.id); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
