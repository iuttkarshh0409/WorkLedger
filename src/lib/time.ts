/**
 * Time Utilities
 *
 * Relative timestamp formatting for the UI layer.
 *
 * formatRelativeTime(iso)
 *   Returns a human-readable relative string:
 *     < 1 minute ago   → "just now"
 *     < 1 hour         → "X minutes ago"
 *     < 24 hours       → "X hours ago"
 *     yesterday        → "Yesterday"
 *     < 7 days         → "X days ago"
 *     same year        → "Jul 7"
 *     older            → "Jul 7, 2025"
 *
 * formatExactTime(iso)
 *   Returns a precise, human-readable string suitable for a tooltip:
 *     "Jul 7, 2026 at 4:42 PM"
 *
 * Usage:
 *   <time dateTime={iso} title={formatExactTime(iso)}>
 *     {formatRelativeTime(iso)}
 *   </time>
 */

/**
 * formatRelativeTime
 *
 * Converts an ISO 8601 timestamp to a relative human-readable string.
 * All comparisons are made against the current time at call time.
 */
export function formatRelativeTime(iso: string): string {
  const now  = Date.now();
  const then = new Date(iso).getTime();
  const diffMs   = now - then;
  const diffSecs = Math.floor(diffMs / 1_000);
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours= Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffSecs < 60)  return 'just now';
  if (diffMins < 60)  return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)   return `${diffDays} days ago`;

  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day:   'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * formatExactTime
 *
 * Returns a precise timestamp string for use as a tooltip value.
 * Intended to pair with formatRelativeTime so users can see the exact
 * time by hovering, while the visible text stays concise.
 *
 * Example: "Jul 7, 2026 at 4:42 PM"
 */
export function formatExactTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month:  'short',
    day:    'numeric',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  });
}
