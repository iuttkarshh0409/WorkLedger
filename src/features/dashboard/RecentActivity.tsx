/**
 * RecentActivity
 *
 * Displays the ten most recent workspace events, newest first.
 * Provides a quick operational view of what has been happening.
 *
 * @see docs/03.5_system_architecture.md (Event-Driven Thinking)
 */

import type { Activity } from '@domain';

// ─── Activity label map ───────────────────────────────────────────────────────

function activityLabel(type: string): string {
  // The ActivityType enum values are already human-readable strings
  return type;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Single row ───────────────────────────────────────────────────────────────

function ActivityRow({ activity }: { activity: Activity }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      {/* Dot */}
      <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-primary">{activityLabel(activity.type)}</p>
        <time
          dateTime={activity.timestamp}
          className="text-xs text-text-muted"
        >
          {formatDate(activity.timestamp)}
        </time>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="card flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-text-primary">Recent activity</h2>
      {activities.length === 0 ? (
        <p className="text-xs text-text-muted py-2">
          No activity yet. Events will appear here as work progresses.
        </p>
      ) : (
        <div>
          {activities.map((a) => (
            <ActivityRow key={a.id} activity={a} />
          ))}
        </div>
      )}
    </div>
  );
}
