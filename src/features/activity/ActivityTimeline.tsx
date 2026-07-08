/**
 * ActivityTimeline
 *
 * Renders the full filtered list of Activity events as a vertical timeline.
 * Activities are displayed newest-first (reversed from storage order).
 *
 * @see docs/03.5_system_architecture.md (Event-Driven Thinking)
 */

import type { Activity, Contributor } from '@domain';
import { ActivityCard } from './ActivityCard';

interface ActivityTimelineProps {
  activities:   Activity[];
  contributors: Contributor[];
}

export function ActivityTimeline({ activities, contributors }: ActivityTimelineProps) {
  return (
    <div className="flex flex-col">
      {activities.map((activity, index) => {
        const actor = contributors.find(
          (c) => c.id === activity.performedBy || c.id === activity.contributorId,
        );
        return (
          <ActivityCard
            key={activity.id}
            activity={activity}
            actor={actor}
            isLast={index === activities.length - 1}
          />
        );
      })}
    </div>
  );
}
