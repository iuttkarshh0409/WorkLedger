/**
 * AccordionCard
 *
 * A card that can be expanded to reveal additional content below.
 * The header row is always visible; the body renders only when expanded.
 *
 * This component replaces the inline expand/collapse pattern first
 * introduced in AssignmentsPage and is now the canonical way to render
 * expandable cards throughout the application.
 *
 * Accessibility:
 * - Header button uses aria-expanded.
 * - Body panel is identified by aria-controls / id.
 * - Keyboard: Enter or Space toggles expansion.
 *
 * @see docs/06.5_component_architecture.md (Layer 3 — Feature Modules)
 */

import { type ReactNode, useId } from 'react';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccordionCardProps {
  /** The always-visible header content. Rendered inside the toggle button area. */
  header:       ReactNode;
  /** The expandable body content. Rendered only when open=true. */
  children:     ReactNode;
  /** Whether the panel is currently expanded. */
  open:         boolean;
  /** Called when the user toggles the card. */
  onToggle:     () => void;
  /** Optional extra classes applied to the outer card wrapper. */
  className?:   string;
  /** Optional extra classes applied to the header row. */
  headerClassName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AccordionCard({
  header,
  children,
  open,
  onToggle,
  className,
  headerClassName,
}: AccordionCardProps) {
  const panelId = useId();

  return (
    <div
      className={clsx(
        'bg-surface border border-border rounded-lg',
        open && 'rounded-b-none border-b-0',
        className,
      )}
    >
      {/* Toggle header */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={clsx(
          'w-full text-left p-4 rounded-lg',
          open && 'rounded-b-none',
          'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
          'transition-colors duration-150',
          headerClassName,
        )}
      >
        {header}
      </button>

      {/* Expandable body */}
      {open && (
        <div
          id={panelId}
          role="region"
          className="border-t border-border bg-surface rounded-b-lg p-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}
