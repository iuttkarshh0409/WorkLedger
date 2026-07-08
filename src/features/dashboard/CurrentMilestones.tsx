/**
 * CurrentMilestones
 *
 * Dashboard widget — shows active and planned milestones with derived progress.
 * Links to the Milestones page.
 */

import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { ProgressBar } from '@shared/components/ProgressBar';
import { ROUTES } from '@shared/constants/routes';
import type { Milestone } from '@domain';
import { MilestoneStatus } from '@domain';
import type { MilestoneProgress } from '@features/milestones/useMilestones';

interface CurrentMilestonesProps {
  milestones: Milestone[];
  progress:   MilestoneProgress[];
}

export function CurrentMilestones({ milestones, progress }: CurrentMilestonesProps) {
  const active = milestones.filter(
    (m) =>
      m.status === MilestoneStatus.Active ||
      m.status === MilestoneStatus.Planned,
  );

  const progressFor = (id: string) =>
    progress.find((p) => p.milestoneId === id) ?? { milestoneId: id, total: 0, completed: 0 };

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Current milestones</h2>
        <Link
          to={ROUTES.MILESTONES}
          className="text-xs text-accent hover:text-accent-hover transition-colors"
        >
          View all
        </Link>
      </div>

      {active.length === 0 ? (
        <p className="text-xs text-text-muted py-2">
          No active milestones. Create one on the{' '}
          <Link to={ROUTES.MILESTONES} className="text-accent hover:text-accent-hover">
            Milestones page
          </Link>
          .
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {active.slice(0, 4).map((milestone) => {
            const p = progressFor(milestone.id);
            const pct = p.total === 0 ? 0 : Math.round((p.completed / p.total) * 100);
            const isOverdue =
              milestone.status !== MilestoneStatus.Completed &&
              new Date(milestone.deadline) < new Date();

            return (
              <div key={milestone.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-text-primary truncate flex-1">
                    {milestone.title}
                  </span>
                  <span
                    className={clsx(
                      'text-xs shrink-0',
                      isOverdue ? 'text-danger font-medium' : 'text-text-muted',
                    )}
                  >
                    {isOverdue ? 'Overdue' : (
                      new Date(milestone.deadline).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })
                    )}
                  </span>
                </div>
                <ProgressBar
                  value={p.completed}
                  max={p.total || 1}
                  showLabel={p.total > 0}
                  variant={pct === 100 ? 'success' : isOverdue ? 'warning' : 'default'}
                  aria-label={`${milestone.title}: ${p.completed} of ${p.total} assignments completed`}
                />
                {p.total === 0 && (
                  <p className="text-xs text-text-muted">No assignments yet</p>
                )}
              </div>
            );
          })}
          {active.length > 4 && (
            <Link
              to={ROUTES.MILESTONES}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              +{active.length - 4} more milestones
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
