/**
 * AssignmentFormDialog
 *
 * Modal dialog for creating (and future editing of) an Assignment.
 *
 * Fields:
 *   title*        — required
 *   contributorId*— required, selected from workspace contributors
 *   deadline*     — required date
 *   priority      — Low / Medium / High / Critical (default: Medium)
 *   description   — optional
 *   reviewerId    — optional, selected from workspace contributors
 *   milestoneId   — deferred (no milestones UI yet)
 *
 * Design rules:
 * - Primary action disabled while submitting or required fields are empty.
 * - Service validation errors displayed inline via role=alert.
 * - Uses native <dialog> for focus trapping and Escape handling.
 * - Structured as a reusable form — initialValues prop supports future edit mode.
 *
 * @see docs/07_design_system.md (Forms — label above field, errors inline)
 * @see docs/04_assignment_lifecycle.md (Draft — initial state on creation)
 */

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import { clsx } from 'clsx';
import { AssignmentPriority, AssignmentStatus } from '@domain';
import type { Contributor, Milestone } from '@domain';
import { useHistoricalMode } from '@app/HistoricalModeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssignmentFormValues {
  title:         string;
  description:   string;
  contributorId: string;
  reviewerId:    string;
  milestoneId:   string;
  priority:      AssignmentPriority;
  deadline:      string;
  receivedOn?:   string;
  initialStatus?: string;
}

const DEFAULT_VALUES: AssignmentFormValues = {
  title:         '',
  description:   '',
  contributorId: '',
  reviewerId:    '',
  milestoneId:   '',
  priority:      AssignmentPriority.Medium,
  deadline:      '',
  receivedOn:    '',
  initialStatus: '',
};

interface AssignmentFormDialogProps {
  open:           boolean;
  initialValues?: Partial<AssignmentFormValues>;
  submitLabel:    string;
  submitting:     boolean;
  error:          string | null;
  contributors:   Contributor[];
  milestones?:    Milestone[];
  onSubmit:       (values: AssignmentFormValues) => void;
  onClose:        () => void;
}

// ─── Priority options ─────────────────────────────────────────────────────────

const PRIORITY_OPTIONS: { value: AssignmentPriority; label: string }[] = [
  { value: AssignmentPriority.Low,      label: 'Low' },
  { value: AssignmentPriority.Medium,   label: 'Medium' },
  { value: AssignmentPriority.High,     label: 'High' },
  { value: AssignmentPriority.Critical, label: 'Critical' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's date as a yyyy-mm-dd string for the min attribute on date inputs. */
function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssignmentFormDialog({
  open,
  initialValues,
  submitLabel,
  submitting,
  error,
  contributors,
  milestones = [],
  onSubmit,
  onClose,
}: AssignmentFormDialogProps) {
  const { historicalMode } = useHistoricalMode();
  const dialogRef   = useRef<HTMLDialogElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<AssignmentFormValues>({
    ...DEFAULT_VALUES,
    ...initialValues,
  });

  // Sync with initialValues and open/close the native dialog
  useEffect(() => {
    if (open) {
      setValues({ ...DEFAULT_VALUES, ...initialValues });
      dialogRef.current?.showModal();
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } else {
      dialogRef.current?.close();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    if (!submitting) onClose();
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    onSubmit({
      ...values,
      ...(historicalMode ? {
        isHistorical: true,
        receivedOn: values.receivedOn,
        initialStatus: values.initialStatus,
      } as any : {}),
    });
  };

  const isSubmitDisabled =
    submitting ||
    !values.title.trim() ||
    !values.contributorId ||
    !values.deadline ||
    (historicalMode && (!values.receivedOn || !values.initialStatus));

  const fieldClass = clsx(
    'w-full rounded-md border border-border bg-surface px-3 py-2',
    'text-sm text-text-primary placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
    'transition-colors duration-150',
  );

  const labelClass = 'block text-xs font-medium text-text-secondary mb-1';
  const requiredMark = <span aria-hidden="true" className="text-danger ml-0.5">*</span>;

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      className={clsx(
        'rounded-lg border border-border bg-surface shadow-xl',
        'w-full max-w-lg p-0 overflow-hidden',
      )}
      aria-labelledby="assignment-dialog-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h2
          id="assignment-dialog-title"
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
            'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Scrollable form body */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 px-6 py-5">

          {/* Title */}
          <div>
            <label htmlFor="a-title" className={labelClass}>
              Title {requiredMark}
            </label>
            <input
              ref={firstInputRef}
              id="a-title"
              name="title"
              type="text"
              required
              value={values.title}
              onChange={handleChange}
              placeholder="What needs to be done?"
              className={fieldClass}
              disabled={submitting}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="a-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="a-description"
              name="description"
              rows={3}
              value={values.description}
              onChange={handleChange}
              placeholder="Provide context, requirements, or acceptance criteria…"
              className={clsx(fieldClass, 'resize-y min-h-[72px]')}
              disabled={submitting}
            />
          </div>

          {/* Contributor + Priority row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="a-contributor" className={labelClass}>
                Contributor {requiredMark}
              </label>
              <div className="relative">
                <select
                  id="a-contributor"
                  name="contributorId"
                  required
                  value={values.contributorId}
                  onChange={handleChange}
                  className={clsx(fieldClass, 'pr-8 cursor-pointer appearance-none')}
                  disabled={submitting || contributors.length === 0}
                >
                  <option value="">Select contributor</option>
                  {contributors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                  xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
              {contributors.length === 0 && (
                <p className="mt-1 text-xs text-warning">
                  Add contributors first.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="a-priority" className={labelClass}>Priority</label>
              <div className="relative">
                <select
                  id="a-priority"
                  name="priority"
                  value={values.priority}
                  onChange={handleChange}
                  className={clsx(fieldClass, 'pr-8 cursor-pointer appearance-none')}
                  disabled={submitting}
                >
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                  xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Historical Data Entry fields */}
          {historicalMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-muted/30 p-3 rounded border border-dashed border-border/80">
              <div>
                <label htmlFor="a-receivedOn" className={labelClass}>
                  Received On {requiredMark}
                </label>
                <input
                  id="a-receivedOn"
                  name="receivedOn"
                  type="date"
                  required
                  value={values.receivedOn || ''}
                  onChange={handleChange}
                  className={clsx(fieldClass, 'cursor-pointer')}
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="a-initialStatus" className={labelClass}>
                  Initial Status {requiredMark}
                </label>
                <div className="relative">
                  <select
                    id="a-initialStatus"
                    name="initialStatus"
                    required
                    value={values.initialStatus || ''}
                    onChange={handleChange}
                    className={clsx(fieldClass, 'pr-8 cursor-pointer appearance-none')}
                    disabled={submitting}
                  >
                    <option value="">Select status</option>
                    <option value={AssignmentStatus.Assigned}>Assigned</option>
                    <option value={AssignmentStatus.Accepted}>Accepted</option>
                    <option value={AssignmentStatus.InProgress}>In Progress</option>
                    <option value={AssignmentStatus.Completed}>Completed</option>
                  </select>
                  <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                    xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                    strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Deadline + Reviewer row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="a-deadline" className={labelClass}>
                Deadline {requiredMark}
              </label>
              <input
                id="a-deadline"
                name="deadline"
                type="date"
                required
                min={historicalMode ? undefined : todayISO()}
                value={values.deadline}
                onChange={handleChange}
                className={clsx(fieldClass, 'cursor-pointer')}
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="a-reviewer" className={labelClass}>
                Reviewer <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <div className="relative">
                <select
                  id="a-reviewer"
                  name="reviewerId"
                  value={values.reviewerId}
                  onChange={handleChange}
                  className={clsx(fieldClass, 'pr-8 cursor-pointer appearance-none')}
                  disabled={submitting || contributors.length === 0}
                >
                  <option value="">No reviewer</option>
                  {contributors
                    .filter((c) => c.id !== values.contributorId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                  xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Milestone (optional) */}
          {milestones.length > 0 && (
            <div>
              <label htmlFor="a-milestone" className={labelClass}>
                Milestone <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <div className="relative">
                <select
                  id="a-milestone"
                  name="milestoneId"
                  value={values.milestoneId}
                  onChange={handleChange}
                  className={clsx(fieldClass, 'pr-8 cursor-pointer appearance-none')}
                  disabled={submitting}
                >
                  <option value="">No milestone</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                  xmlns="http://www.w3.org/2000/svg" width={10} height={10} viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
                  strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          )}

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
            disabled={isSubmitDisabled}
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
