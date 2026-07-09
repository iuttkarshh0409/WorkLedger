import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

interface DeleteAssignmentDialogProps {
  open: boolean;
  assignmentTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteAssignmentDialog({
  open,
  assignmentTitle,
  onConfirm,
  onCancel,
}: DeleteAssignmentDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (open) {
      setConfirmText('');
      dialogRef.current?.showModal();
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    onCancel();
  };

  const isConfirmed = confirmText === 'DELETE';

  return (
    <dialog
      ref={dialogRef}
      onCancel={handleCancel}
      role="alertdialog"
      aria-labelledby="delete-title"
      aria-describedby="delete-message"
      className={clsx(
        'rounded-lg border border-border bg-surface shadow-xl',
        'w-full max-w-md p-0 overflow-hidden',
      )}
    >
      <div className="flex flex-col gap-4 p-6">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 text-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 id="delete-title" className="text-sm font-semibold text-text-primary">
              Delete Assignment
            </h2>
            <p id="delete-message" className="mt-1 text-sm text-text-secondary">
              You are about to permanently delete <strong className="text-text-primary">"{assignmentTitle}"</strong>.
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Input area */}
        <div className="mt-2">
          <label htmlFor="confirm-delete-input" className="block text-xs font-medium text-text-secondary mb-1">
            Type <span className="font-bold text-text-primary">DELETE</span> to continue.
          </label>
          <input
            ref={inputRef}
            id="confirm-delete-input"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className={clsx(
              'w-full rounded-md border border-border bg-surface px-3 py-2',
              'text-sm text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:ring-2 focus:ring-danger focus:border-danger',
              'transition-colors duration-150',
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-2">
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
            Cancel
          </button>
          <button
            type="button"
            disabled={!isConfirmed}
            onClick={onConfirm}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium text-white transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger',
              isConfirmed ? 'bg-danger hover:bg-red-700' : 'bg-red-300 cursor-not-allowed opacity-50'
            )}
          >
            Delete Assignment
          </button>
        </div>
      </div>
    </dialog>
  );
}
