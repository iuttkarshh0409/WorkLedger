/**
 * ContributorFormDialog
 *
 * Modal dialog for creating (and future editing of) a Contributor.
 *
 * Design rules:
 * - Structured as a reusable form that accepts an initial value for edit mode.
 * - Primary action is disabled while submitting to prevent duplicates.
 * - Validation errors from the service layer are displayed inline.
 * - Uses the native <dialog> element for accessibility and focus trapping.
 *
 * @see docs/07_design_system.md (Forms — label above field, errors inline)
 */

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import { clsx } from 'clsx';
import { ContributorRole } from '@domain';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContributorFormValues {
  name:  string;
  email: string;
  role:  ContributorRole;
}

const DEFAULT_VALUES: ContributorFormValues = {
  name:  '',
  email: '',
  role:  ContributorRole.Contributor,
};

interface ContributorFormDialogProps {
  open:        boolean;
  initialValues?: Partial<ContributorFormValues>;
  submitLabel: string;
  submitting:  boolean;
  error:       string | null;
  onSubmit:    (values: ContributorFormValues) => void;
  onClose:     () => void;
}

// ─── Role options ─────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: ContributorRole; label: string; description: string }[] = [
  {
    value:       ContributorRole.Owner,
    label:       'Owner',
    description: 'Full access. Manages workspace, members, and all assignments.',
  },
  {
    value:       ContributorRole.Reviewer,
    label:       'Reviewer',
    description: 'Creates and reviews assignments. Cannot manage workspace settings.',
  },
  {
    value:       ContributorRole.Contributor,
    label:       'Contributor',
    description: 'Accepts and submits assignments. The most common role.',
  },
  {
    value:       ContributorRole.Observer,
    label:       'Observer',
    description: 'Read-only access. Can view all workspace content.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function ContributorFormDialog({
  open,
  initialValues,
  submitLabel,
  submitting,
  error,
  onSubmit,
  onClose,
}: ContributorFormDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<ContributorFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  // Sync initialValues when dialog opens
  useEffect(() => {
    if (open) {
      setValues({ ...DEFAULT_VALUES, ...initialValues });
      // Open the native dialog
      dialogRef.current?.showModal();
      // Focus first input on next tick
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      dialogRef.current?.close();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Allow closing with Escape key via the native dialog behaviour
  const handleDialogCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    if (!submitting) onClose();
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    onSubmit(values);
  };

  const fieldClass = clsx(
    'w-full rounded-md border border-border bg-surface px-3 py-2',
    'text-sm text-text-primary placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
    'transition-colors duration-150',
  );

  const labelClass = 'block text-xs font-medium text-text-secondary mb-1';

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleDialogCancel}
      className={clsx(
        'rounded-lg border border-border bg-surface shadow-xl',
        'w-full max-w-md p-0 overflow-hidden',
      )}
      aria-labelledby="contributor-dialog-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h2
          id="contributor-dialog-title"
          className="text-sm font-semibold text-text-primary"
        >
          {submitLabel}
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close dialog"
          className={clsx(
            'flex items-center justify-center w-7 h-7 rounded-md',
            'text-text-muted hover:text-text-primary hover:bg-surface-muted',
            'transition-colors duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-4 px-6 py-5">
          {/* Name */}
          <div>
            <label htmlFor="contributor-name" className={labelClass}>
              Name <span aria-hidden="true" className="text-danger">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="contributor-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={values.name}
              onChange={handleChange}
              placeholder="Full name"
              className={fieldClass}
              disabled={submitting}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="contributor-email" className={labelClass}>
              Email <span aria-hidden="true" className="text-danger">*</span>
            </label>
            <input
              id="contributor-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className={fieldClass}
              disabled={submitting}
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="contributor-role" className={labelClass}>
              Role
            </label>
            <select
              id="contributor-role"
              name="role"
              value={values.role}
              onChange={handleChange}
              className={clsx(fieldClass, 'cursor-pointer')}
              disabled={submitting}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {/* Role description */}
            <p className="mt-1 text-xs text-text-muted">
              {ROLE_OPTIONS.find((o) => o.value === values.role)?.description}
            </p>
          </div>

          {/* Service error */}
          {error && (
            <div
              role="alert"
              className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium',
              'text-text-secondary hover:text-text-primary hover:bg-surface-muted',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !values.name.trim() || !values.email.trim()}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium',
              'text-text-inverse bg-accent hover:bg-accent-hover',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            {submitting ? 'Saving…' : submitLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
