/**
 * SubmitWorkDialog
 *
 * Modal dialog for submitting work on an Assignment.
 * Handles both initial submission (In Progress → Submitted)
 * and resubmission after revision request (Revision Requested → Under Review).
 *
 * Fields:
 *   description      — what was done (optional but encouraged)
 *   githubRepository — URL to repository (optional)
 *   pullRequest      — URL to pull request (optional)
 *   demoLink         — URL to live demo (optional)
 *   notes            — freeform notes for the reviewer (optional)
 *
 * Design rules:
 * - Primary action disabled while submitting.
 * - Service errors displayed inline via role=alert.
 * - Uses native <dialog> for focus trapping and Escape handling.
 * - Mode-aware title and submit label distinguish initial vs revision.
 *
 * @see docs/04_assignment_lifecycle.md (Submitted, Resubmitted)
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

import { useHistoricalMode } from '@app/HistoricalModeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubmitWorkFormValues {
  description:      string;
  githubRepository: string;
  pullRequest:      string;
  demoLink:         string;
  notes:            string;
  submittedOn?:     string;
}

const DEFAULT_VALUES: SubmitWorkFormValues = {
  description:      '',
  githubRepository: '',
  pullRequest:      '',
  demoLink:         '',
  notes:            '',
  submittedOn:      '',
};

export type SubmissionMode = 'submit' | 'resubmit';

interface SubmitWorkDialogProps {
  open:       boolean;
  mode:       SubmissionMode;
  submitting: boolean;
  error:      string | null;
  onSubmit:   (values: SubmitWorkFormValues) => void;
  onClose:    () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function modeTitle(mode: SubmissionMode): string {
  return mode === 'submit' ? 'Submit work' : 'Resubmit work';
}

function modeDescription(mode: SubmissionMode): string {
  return mode === 'submit'
    ? 'Describe what you built and provide any relevant links for the reviewer.'
    : 'Address the requested revisions and describe what changed since the last submission.';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SubmitWorkDialog({
  open,
  mode,
  submitting,
  error,
  onSubmit,
  onClose,
}: SubmitWorkDialogProps) {
  const { historicalMode } = useHistoricalMode();
  const dialogRef     = useRef<HTMLDialogElement>(null);
  const firstInputRef = useRef<HTMLTextAreaElement>(null);
  const [values, setValues] = useState<SubmitWorkFormValues>(DEFAULT_VALUES);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValues(DEFAULT_VALUES);
      setLocalError(null);
      dialogRef.current?.showModal();
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    if (!submitting) onClose();
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (!values.description.trim()) {
      setLocalError('Submission Title / Description is required.');
      return;
    }
    if (!values.githubRepository.trim()) {
      setLocalError('Submission URL / Repository Link is required.');
      return;
    }
    if (historicalMode && !values.submittedOn) {
      setLocalError('Submitted On date is required in Historical Mode.');
      return;
    }
    setLocalError(null);
    onSubmit({
      ...values,
      ...(historicalMode ? {
        isHistorical: true,
        submittedOn: values.submittedOn,
      } as any : {}),
    });
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
      onCancel={handleCancel}
      className={clsx(
        'rounded-lg border border-border bg-surface shadow-xl',
        'w-full max-w-lg p-0 overflow-hidden',
      )}
      aria-labelledby="submit-dialog-title"
      aria-describedby="submit-dialog-desc"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h2
            id="submit-dialog-title"
            className="text-sm font-semibold text-text-primary"
          >
            {modeTitle(mode)}
          </h2>
          <p id="submit-dialog-desc" className="text-xs text-text-secondary mt-0.5">
            {modeDescription(mode)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close dialog"
          className={clsx(
            'flex items-center justify-center w-7 h-7 rounded-md shrink-0',
            'text-text-muted hover:text-text-primary hover:bg-surface-muted',
            'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 px-6 py-5">

          {/* Historical Data Entry */}
          {historicalMode && (
            <div className="bg-surface-muted/30 p-3 rounded border border-dashed border-border/80">
              <label htmlFor="s-submittedOn" className={labelClass}>
                Submitted On <span className="text-danger">*</span>
              </label>
              <input
                id="s-submittedOn"
                name="submittedOn"
                type="date"
                required
                value={values.submittedOn || ''}
                onChange={handleChange}
                className={clsx(fieldClass, 'cursor-pointer')}
                disabled={submitting}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label htmlFor="s-description" className={labelClass}>
              Submission Title / Description (required)
            </label>
            <textarea
              ref={firstInputRef}
              id="s-description"
              name="description"
              rows={4}
              value={values.description}
              onChange={handleChange}
              placeholder={
                mode === 'resubmit'
                  ? 'Describe what changed since the last submission…'
                  : 'Describe what you built, key decisions made, and how to test it…'
              }
              className={clsx(fieldClass, 'resize-y min-h-[96px]')}
              disabled={submitting}
            />
          </div>

          {/* Links section */}
          <fieldset className="flex flex-col gap-3 border-0 p-0 m-0">
            <legend className="text-xs font-medium text-text-secondary mb-1">
              Links
            </legend>

            <div>
              <label htmlFor="s-repo" className={labelClass}>
                Submission URL / Repository Link (required)
              </label>
              <input
                id="s-repo"
                name="githubRepository"
                type="url"
                value={values.githubRepository}
                onChange={handleChange}
                placeholder="https://github.com/user/repo"
                className={fieldClass}
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="s-pr" className={labelClass}>
                Pull request URL <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                id="s-pr"
                name="pullRequest"
                type="url"
                value={values.pullRequest}
                onChange={handleChange}
                placeholder="https://github.com/user/repo/pull/1"
                className={fieldClass}
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="s-demo" className={labelClass}>
                Live demo URL <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <input
                id="s-demo"
                name="demoLink"
                type="url"
                value={values.demoLink}
                onChange={handleChange}
                placeholder="https://my-demo.example.com"
                className={fieldClass}
                disabled={submitting}
              />
            </div>
          </fieldset>

          {/* Notes for reviewer */}
          <div>
            <label htmlFor="s-notes" className={labelClass}>
              Notes for reviewer <span className="text-text-muted font-normal">(optional)</span>
            </label>
            <textarea
              id="s-notes"
              name="notes"
              rows={2}
              value={values.notes}
              onChange={handleChange}
              placeholder="Anything the reviewer should know before evaluating…"
              className={clsx(fieldClass, 'resize-y')}
              disabled={submitting}
            />
          </div>

          {/* Service error */}
          {(localError || error) && (
            <div
              role="alert"
              className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700"
            >
              {localError || error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium',
              'text-text-secondary hover:text-text-primary hover:bg-surface-muted',
              'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium',
              'text-text-inverse bg-accent hover:bg-accent-hover',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            {submitting ? 'Submitting…' : modeTitle(mode)}
          </button>
        </div>
      </form>
    </dialog>
  );
}
