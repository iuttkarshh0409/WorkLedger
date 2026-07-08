/**
 * PlaceholderPage
 *
 * Reusable scaffold displayed for modules not yet implemented.
 *
 * Renders the module's canonical name and a purposeful description of
 * what the module will do, plus the planned implementation milestone.
 *
 * Follows the design principle: empty states should educate, not simply
 * indicate missing data (07_design_system.md).
 */

import { clsx } from 'clsx';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PlaceholderPageProps {
  title: string;
  description: string;
  milestone: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PlaceholderPage({
  title,
  description,
  milestone,
}: PlaceholderPageProps) {
  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <h2 className="page-title">{title}</h2>
      </div>

      {/* Placeholder content card */}
      <div
        className={clsx(
          'card flex flex-col gap-4 max-w-lg',
          'border-border',
        )}
      >
        <p className="text-sm text-text-secondary leading-relaxed">
          {description}
        </p>

        <div className="divider" />

        <p className="text-xs text-text-muted">
          Planned for{' '}
          <span className="font-medium text-text-secondary">{milestone}</span>
          . This module will be implemented in a future session.
        </p>
      </div>
    </div>
  );
}
