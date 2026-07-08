/**
 * ContributorList
 *
 * Renders the list of Contributors.
 *
 * Shows active contributors by default.
 * Archived contributors are hidden unless the user toggles visibility.
 * Each card is rendered with consistent structure regardless of data completeness.
 */

import { useState } from 'react';
import { clsx } from 'clsx';
import type { Contributor } from '@domain';
import { ContributorStatus } from '@domain';
import { ContributorCard } from './ContributorCard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContributorListProps {
  contributors: Contributor[];
  onArchive:    (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContributorList({ contributors, onArchive }: ContributorListProps) {
  const [showArchived, setShowArchived] = useState(false);

  const active   = contributors.filter((c) => c.status !== ContributorStatus.Archived);
  const archived = contributors.filter((c) => c.status === ContributorStatus.Archived);
  const visible  = showArchived ? contributors : active;

  return (
    <div className="flex flex-col gap-3">
      {/* List */}
      {visible.map((contributor) => (
        <ContributorCard
          key={contributor.id}
          contributor={contributor}
          onArchive={onArchive}
        />
      ))}

      {/* Archived toggle */}
      {archived.length > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowArchived((prev) => !prev)}
            className={clsx(
              'text-xs text-text-muted hover:text-text-secondary',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            {showArchived
              ? `Hide ${archived.length} archived contributor${archived.length !== 1 ? 's' : ''}`
              : `Show ${archived.length} archived contributor${archived.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
