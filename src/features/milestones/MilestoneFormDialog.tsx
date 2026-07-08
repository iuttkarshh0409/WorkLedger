/**
 * MilestoneFormDialog
 *
 * Modal dialog for creating a Milestone.
 * Fields: title, description, startDate, deadline.
 */

import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from 'react';
import { clsx } from 'clsx';

export interface MilestoneFormValues {
  title:       string;
  description: string;
  startDate:   string;
  deadline:    string;
}

const DEFAULT: MilestoneFormValues = { title: '', description: '', startDate: '', deadline: '' };

interface MilestoneFormDialogProps {
  open:        boolean;
  submitting:  boolean;
  error:       string | null;
  onSubmit:    (values: MilestoneFormValues) => void;
  onClose:     () => void;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function MilestoneFormDialog({
  open, submitting, error, onSubmit, onClose,
}: MilestoneFormDialogProps) {
  const dialogRef    = useRef<HTMLDialogElement>(null);
  const firstRef     = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<MilestoneFormValues>(DEFAULT);

  useEffect(() => {
    if (open) {
      setValues(DEFAULT);
      dialogRef.current?.showModal();
      setTimeout(() => firstRef.current?.focus(), 50);
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    if (!submitting) onClose();
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    onSubmit(values);
  };

  const disabled = submitting || !values.title.trim() || !values.startDate || !values.deadline;

  const fieldClass = clsx(
    'w-full rounded-md border border-border bg-surface px-3 py-2',
    'text-sm text-text-primary placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
    'transition-colors duration-150',
  );
  const labelClass = 'block text-xs font-medium text-text-secondary mb-1';
  const req = <span aria-hidden="true" className="text-danger ml-0.5">*</span>;

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      className={clsx(
        'rounded-lg border border-border bg-surface shadow-xl',
        'w-full max-w-md p-0 overflow-hidden',
      )}
      aria-labelledby="ms-dialog-title"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h2 id="ms-dialog-title" className="text-sm font-semibold text-text-primary">
          Create milestone
        </h2>
        <button type="button" onClick={onClose} disabled={submitting} aria-label="Close dialog"
          className="flex items-center justify-center w-7 h-7 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-muted transition-colors duration-150 disabled:opacity-50">
          <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
            strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 px-6 py-5">
          <div>
            <label htmlFor="ms-title" className={labelClass}>Title {req}</label>
            <input ref={firstRef} id="ms-title" name="title" type="text" required
              value={values.title} onChange={handleChange}
              placeholder="Sprint 1, Phase A, v2.0 release…"
              className={fieldClass} disabled={submitting} />
          </div>

          <div>
            <label htmlFor="ms-desc" className={labelClass}>Description</label>
            <textarea id="ms-desc" name="description" rows={2}
              value={values.description} onChange={handleChange}
              placeholder="What does this milestone cover?"
              className={clsx(fieldClass, 'resize-y')} disabled={submitting} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ms-start" className={labelClass}>Start date {req}</label>
              <input id="ms-start" name="startDate" type="date" required
                min={todayISO()} max={values.deadline || undefined}
                value={values.startDate} onChange={handleChange}
                className={clsx(fieldClass, 'cursor-pointer')} disabled={submitting} />
            </div>
            <div>
              <label htmlFor="ms-deadline" className={labelClass}>Deadline {req}</label>
              <input id="ms-deadline" name="deadline" type="date" required
                min={values.startDate || todayISO()}
                value={values.deadline} onChange={handleChange}
                className={clsx(fieldClass, 'cursor-pointer')} disabled={submitting} />
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <button type="button" onClick={onClose} disabled={submitting}
            className="px-4 py-2 rounded-md text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors duration-150 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={disabled}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium text-text-inverse bg-accent hover:bg-accent-hover',
              'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}>
            {submitting ? 'Saving…' : 'Create milestone'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
