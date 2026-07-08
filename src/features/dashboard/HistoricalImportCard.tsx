import { useEffect, useState } from 'react';
import { useServices } from '@hooks/useServices';
import { useSession } from '@app/SessionContext';
import { useHistoricalMode } from '@app/HistoricalModeContext';
import { ActivityType, Activity } from '@domain';
import { isDomainError } from '@lib/errors';

function formatDateShort(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'N/A';
  }
}

export function HistoricalImportCard() {
  const { historicalMode } = useHistoricalMode();
  const { activity: activityService } = useServices();
  const { session } = useSession();

  const [stats, setStats] = useState<{
    assignmentsCount: number;
    submissionsCount: number;
    reviewsCount: number;
    oldestDate: string | null;
    newestDate: string | null;
  } | null>(null);

  useEffect(() => {
    if (!historicalMode || !session?.workspaceId) {
      return;
    }

    let isCancelled = false;

    async function loadStats() {
      const result = await activityService.getActivitiesByWorkspace(session!.workspaceId);
      if (isCancelled || isDomainError(result)) return;

      const historicalActivities = result.filter((act: Activity) => act.metadata?.isHistorical === true);

      let assignments = 0;
      let submissions = 0;
      let reviews = 0;
      let oldest: string | null = null;
      let newest: string | null = null;

      historicalActivities.forEach((act: Activity) => {
        if (act.type === ActivityType.AssignmentCreated) assignments++;
        else if (act.type === ActivityType.SubmissionUploaded) submissions++;
        else if (act.type === ActivityType.ReviewPublished || act.type === ActivityType.RevisionRequested) reviews++;

        const t = act.timestamp;
        if (!oldest || t < oldest) oldest = t;
        if (!newest || t > newest) newest = t;
      });

      setStats({
        assignmentsCount: assignments,
        submissionsCount: submissions,
        reviewsCount: reviews,
        oldestDate: oldest,
        newestDate: newest,
      });
    }

    loadStats();

    // Refresh stats every 3 seconds to keep it dynamically updated while Owner is importing
    const interval = setInterval(loadStats, 3000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [historicalMode, session?.workspaceId, activityService]);

  if (!historicalMode || !stats) return null;

  return (
    <div className="rounded-xl border border-dashed border-accent/40 bg-accent-subtle/20 p-5 shadow-sm transition-all duration-200">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
        <h3 className="text-sm font-semibold text-text-primary">
          Historical Data Migration Summary
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="block text-xs font-medium text-text-secondary">Assignments Imported</span>
          <span className="text-xl font-bold text-text-primary mt-1 block">{stats.assignmentsCount}</span>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="block text-xs font-medium text-text-secondary">Submissions Imported</span>
          <span className="text-xl font-bold text-text-primary mt-1 block">{stats.submissionsCount}</span>
        </div>
        <div className="bg-surface rounded-lg p-3 border border-border">
          <span className="block text-xs font-medium text-text-secondary">Reviews/Revisions Imported</span>
          <span className="text-xl font-bold text-text-primary mt-1 block">{stats.reviewsCount}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60 text-xs text-text-secondary">
        <div>
          <span className="font-medium">Oldest record:</span>{' '}
          <span className="text-text-primary font-semibold">{stats.oldestDate ? formatDateShort(stats.oldestDate) : '—'}</span>
        </div>
        <div>
          <span className="font-medium">Newest record:</span>{' '}
          <span className="text-text-primary font-semibold">{stats.newestDate ? formatDateShort(stats.newestDate) : '—'}</span>
        </div>
      </div>
    </div>
  );
}
