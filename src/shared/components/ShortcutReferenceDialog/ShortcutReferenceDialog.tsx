/**
 * ShortcutReferenceDialog
 *
 * Displays all active keyboard shortcuts. Opened by pressing `?`.
 *
 * Uses the .kbd CSS utility class from globals.css for key badges.
 */

import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

// ─── Shortcut definitions ─────────────────────────────────────────────────────

const SHORTCUTS: { keys: string[]; description: string }[] = [
  { keys: ['N'],   description: 'New assignment' },
  { keys: ['C'],   description: 'New contributor' },
  { keys: ['/'],   description: 'Focus search' },
  { keys: ['?'],   description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close open dialog' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShortcutReferenceDialogProps {
  open:    boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ShortcutReferenceDialog({ open, onClose }: ShortcutReferenceDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      className={clsx(
        'rounded-lg border border-border bg-surface shadow-xl',
        'w-full max-w-sm p-0 overflow-hidden',
      )}
      aria-labelledby="shortcut-dialog-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2 id="shortcut-dialog-title" className="text-sm font-semibold text-text-primary">
          Keyboard shortcuts
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close shortcuts"
          className={clsx(
            'flex items-center justify-center w-7 h-7 rounded-md',
            'text-text-muted hover:text-text-primary hover:bg-surface-muted',
            'transition-colors duration-150',
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Shortcut list */}
      <div className="flex flex-col divide-y divide-border">
        {SHORTCUTS.map(({ keys, description }) => (
          <div key={keys.join('+')} className="flex items-center justify-between px-6 py-3">
            <span className="text-sm text-text-secondary">{description}</span>
            <div className="flex items-center gap-1">
              {keys.map((k) => (
                <kbd key={k} className="kbd">{k}</kbd>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-6 py-3 border-t border-border">
        <p className="text-xs text-text-muted">
          Shortcuts are inactive while typing in form fields.
        </p>
      </div>
    </dialog>
  );
}
