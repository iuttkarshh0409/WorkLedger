/**
 * ProgressBar
 *
 * Reusable progress indicator for derived completion percentages.
 *
 * Rules:
 * - Accepts `value` (0–100) and `max` (default 100) — never a stored percentage.
 * - Callers compute the ratio from source data (e.g. completed / total assignments).
 * - Displays the percentage label alongside the bar when `showLabel` is true.
 *
 * Variants:
 *   default  — accent blue
 *   success  — green (>= 100%)
 *   warning  — amber (overdue milestones)
 *   danger   — red
 *
 * @see docs/07_design_system.md (Information-first, no decorative charts)
 */

import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgressVariant = 'default' | 'success' | 'warning' | 'danger';

interface ProgressBarProps {
  /** Current value. Combined with max to compute the fill percentage. */
  value:      number;
  /** Maximum value. Defaults to 100. */
  max?:       number;
  /** Show the percentage label to the right of the bar. */
  showLabel?: boolean;
  /** Bar height in Tailwind h-* token. Defaults to h-1.5. */
  height?:    string;
  variant?:   ProgressVariant;
  className?: string;
  /** Accessible label for the progress element. */
  'aria-label'?: string;
}

// ─── Variant styles ───────────────────────────────────────────────────────────

const fillClass: Record<ProgressVariant, string> = {
  default: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  height = 'h-1.5',
  variant = 'default',
  className,
  'aria-label': ariaLabel,
}: ProgressBarProps) {
  const pct     = max === 0 ? 0 : Math.min(Math.round((value / max) * 100), 100);
  const filling = fillClass[variant];

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel}
        className={clsx('flex-1 rounded-full bg-surface-muted overflow-hidden', height)}
      >
        <div
          className={clsx('h-full rounded-full transition-[width] duration-300', filling)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {showLabel && (
        <span className="text-xs text-text-muted tabular-nums w-9 text-right shrink-0">
          {pct}%
        </span>
      )}
    </div>
  );
}
