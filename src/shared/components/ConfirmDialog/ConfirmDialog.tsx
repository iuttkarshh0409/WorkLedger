/**
 * ConfirmDialog
 *
 * Generic confirmation dialog for destructive or irreversible actions.
 * Replaces browser `confirm()` with a consistent, accessible UI.
 *
 * Usage:
 *   <ConfirmDialog
 *     open={showConfirm}
 *     title="Archive contributor"
 *     message="Alex Johnson will be archived. All their history is preserved."
 *     confirmLabel="Archive"
 *     variant="danger"
 *     onConfirm={handleArchive}
 *     onCancel={() => setShowConfirm(false)}
 *   />
 *
 * Accessibility:
 * - Uses native <dialog> for focus trapping.
 * - Confirm button receives initial focus.
 * - Escape key cancels (via onCancel).
 * - role="alertdialog" signals destructive intent to screen readers.
 */

import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConfirmVariant = 'danger' | 'warning' | 'default';

interface ConfirmDialogProps {
  open:          boolean;
  title:         string;
  message:       string;
  confirmLabel?: string;
  cancelLabel?:  string;
  variant?:      ConfirmVariant;
  onConfirm:     () => void;
  onCancel:      () => void;
}

// ─── Variant styles ───────────────────────────────────────────────────────────

const variantConfig: Record<ConfirmVariant, { btn: string; icon: JSX.Element }> = {
  danger: {
    btn: 'bg-danger hover:bg-red-700 text-white',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true" className="text-danger">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
  warning: {
    btn: 'bg-warning hover:bg-amber-600 text-white',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true" className="text-warning">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  default: {
    btn: 'bg-accent hover:bg-accent-hover text-white',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true" className="text-accent">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef  = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cfg        = variantConfig[variant];

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      // Focus confirm button so destructive action requires deliberate choice
      setTimeout(() => confirmRef.current?.focus(), 50);
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      role="alertdialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      className={clsx(
        'rounded-lg border border-border bg-surface shadow-xl',
        'w-full max-w-sm p-0 overflow-hidden',
      )}
    >
      <div className="flex flex-col gap-4 p-6">
        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">{cfg.icon}</div>
          <div>
            <h2 id="confirm-title" className="text-sm font-semibold text-text-primary">
              {title}
            </h2>
            <p id="confirm-message" className="mt-1 text-sm text-text-secondary">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium',
              'text-text-secondary hover:text-text-primary hover:bg-surface-muted',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              cfg.btn,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
