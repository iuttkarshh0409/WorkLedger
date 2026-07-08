/**
 * ActivityCard
 *
 * Displays a single Activity event in the timeline.
 * Compact layout: icon + event title + actor + timestamp + optional metadata summary.
 *
 * @see docs/02_domain_model.md (Activity)
 */

import { clsx } from 'clsx';
import type { Activity, Contributor } from '@domain';
import { groupOfType, type ActivityGroup } from './useActivity';

// ─── Group → icon + colour ────────────────────────────────────────────────────

interface GroupStyle {
  dotClass: string;
  icon:     JSX.Element;
}

function groupStyle(group: ActivityGroup): GroupStyle {
  const baseIcon = (paths: JSX.Element) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      {paths}
    </svg>
  );

  switch (group) {
    case 'workspace':
      return {
        dotClass: 'bg-accent',
        icon: baseIcon(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>),
      };
    case 'contributor':
      return {
        dotClass: 'bg-green-500',
        icon: baseIcon(<><circle cx="12" cy="8" r="4"/><path d="M4 20v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1"/></>),
      };
    case 'milestone':
      return {
        dotClass: 'bg-purple-500',
        icon: baseIcon(<><path d="M3 12h18"/><path d="M3 6l9-3 9 3"/><path d="M3 18l9 3 9-3"/></>),
      };
    case 'assignment':
      return {
        dotClass: 'bg-amber-500',
        icon: baseIcon(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></>),
      };
    case 'submission':
      return {
        dotClass: 'bg-blue-500',
        icon: baseIcon(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>),
      };
    case 'review':
      return {
        dotClass: 'bg-orange-500',
        icon: baseIcon(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>),
      };
    default:
      return {
        dotClass: 'bg-text-muted',
        icon: baseIcon(<><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></>),
      };
  }
}

// ─── Metadata summary ─────────────────────────────────────────────────────────

function MetadataSummary({ metadata }: { metadata: Record<string, unknown> }) {
  const entries = Object.entries(metadata).filter(
    ([, v]) => v !== null && v !== undefined && v !== '' && typeof v !== 'object',
  );
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
      {entries.slice(0, 4).map(([key, value]) => (
        <span key={key} className="text-xs text-text-muted">
          <span className="text-text-secondary">{camelToLabel(key)}: </span>
          {String(value)}
        </span>
      ))}
    </div>
  );
}

function camelToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

import { formatRelativeTime, formatExactTime } from '@lib/time';

// ─── Date formatting ──────────────────────────────────────────────────────────

// formatRelativeTime and formatExactTime imported from @lib/time
// Example output: "5 minutes ago" with tooltip "Jul 7, 2026 at 4:42 PM"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityCardProps {
  activity:     Activity;
  actor:        Contributor | undefined;
  isLast:       boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ActivityCard({ activity, actor, isLast }: ActivityCardProps) {
  const group  = groupOfType(activity.type);
  const style  = groupStyle(group);

  return (
    <div className="flex gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        <div className={clsx('w-3 h-3 rounded-full mt-0.5 shrink-0', style.dotClass)} aria-hidden="true" />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" aria-hidden="true" />}
      </div>

      {/* Content column */}
      <div className={clsx('flex-1 min-w-0 pb-5', isLast && 'pb-0')}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-text-secondary shrink-0">{style.icon}</span>
            <span className="text-sm font-medium text-text-primary">
              {activity.type}
            </span>
          </div>

          <time
            dateTime={activity.timestamp}
            title={formatExactTime(activity.timestamp)}
            className="text-xs text-text-muted shrink-0 text-right"
          >
            {formatRelativeTime(activity.timestamp)}
          </time>
        </div>

        {actor && (
          <p className="text-xs text-text-secondary mt-0.5">
            by {actor.name}
          </p>
        )}

        <MetadataSummary metadata={activity.metadata} />
      </div>
    </div>
  );
}
