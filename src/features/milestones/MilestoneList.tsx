/**
 * MilestoneList
 *
 * Renders the list of MilestoneCards. Active and planned milestones
 * shown first; archived milestones toggled separately.
 */

import { useState } from 'react';
import { clsx } from 'clsx';
import type { Milestone } from '@domain';
import { MilestoneStatus } from '@domain';
import { MilestoneCard } from './MilestoneCard';
import type { MilestoneProgress } from './useMilestones';

interface MilestoneListProps {
  milestones:  Milestone[];
  progress:    MilestoneProgress[];
  onComplete:  (id: string) => void;
  onArchive:   (id: string) => void;
}

export function MilestoneList({ milestones, progress, onComplete, onArchive }: MilestoneListProps) {
  const [showArchived, setShowArchived] = useState(false);

  const active   = milestones.filter((m) => m.status !== MilestoneStatus.Archived);
  const archived = milestones.filter((m) => m.status === MilestoneStatus.Archived);
  const visible  = showArchived ? milestones : active;

  const progressFor = (id: string) =>
    progress.find((p) => p.milestoneId === id) ?? { milestoneId: id, total: 0, completed: 0 };

  return (
    <div className="flex flex-col gap-3">
      {visible.map((m) => (
        <MilestoneCard
          key={m.id}
          milestone={m}
          progress={progressFor(m.id)}
          onComplete={onComplete}
          onArchive={onArchive}
        />
      ))}

      {archived.length > 0 && (
        <div className="pt-2">
          <button type="button"
            onClick={() => setShowArchived((p) => !p)}
            className={clsx(
              'text-xs text-text-muted hover:text-text-secondary',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}>
            {showArchived
              ? `Hide ${archived.length} archived milestone${archived.length !== 1 ? 's' : ''}`
              : `Show ${archived.length} archived milestone${archived.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
