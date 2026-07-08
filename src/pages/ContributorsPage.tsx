/**
 * ContributorsPage
 *
 * Connected container for the Contributors feature.
 *
 * Responsibilities:
 * - Provide useContributors with service instances from context
 * - Manage dialog open/close state
 * - Coordinate add and archive actions
 * - Delegate all rendering to feature components
 *
 * Data flow:
 *   mount → useContributors → getOrCreateDemoWorkspace → getContributorsByWorkspace
 *   add   → ContributorFormDialog → useContributors.addContributor → ContributorService
 *   archive → ContributorCard → useContributors.archiveContributor → ContributorService
 *
 * This component contains no business logic and no styling beyond layout.
 */

import { useState } from 'react';
import { clsx } from 'clsx';
import { useServices } from '@hooks/useServices';
import { useRegisterShortcuts } from '@app/ShortcutContext';
import { useContributors } from '@features/contributors/useContributors';
import { ContributorList } from '@features/contributors/ContributorList';
import { ContributorEmptyState } from '@features/contributors/ContributorEmptyState';
import { ContributorFormDialog } from '@features/contributors/ContributorFormDialog';
import type { ContributorFormValues } from '@features/contributors/ContributorFormDialog';

// ─── Component ────────────────────────────────────────────────────────────────

export function ContributorsPage() {
  const { contributor: contributorService, workspace: workspaceService } =
    useServices();

  const {
    contributors,
    loading,
    error,
    submitting,
    submitError,
    addContributor,
    archiveContributor,
    clearSubmitError,
  } = useContributors(contributorService, workspaceService);

  const [dialogOpen, setDialogOpen] = useState(false);

  // ── Dialog handlers ────────────────────────────────────────────────────────

  const handleOpenDialog = () => {
    clearSubmitError();
    setDialogOpen(true);
  };

  // Keyboard shortcut — must be declared after handleOpenDialog
  useRegisterShortcuts({ onNewContributor: handleOpenDialog });

  const handleCloseDialog = () => {
    if (submitting) return;
    clearSubmitError();
    setDialogOpen(false);
  };

  const handleSubmit = async (values: ContributorFormValues) => {
    const success = await addContributor({
      name:  values.name.trim(),
      email: values.email.trim(),
      role:  values.role,
    });
    if (success) {
      setDialogOpen(false);
    }
    // If not successful, dialog stays open with submitError displayed
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const hasContributors = contributors.length > 0;

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="page-header">
          <h2 className="page-title">Contributors</h2>
          <p className="page-description">
            {hasContributors
              ? `${contributors.length} contributor${contributors.length !== 1 ? 's' : ''} in this workspace`
              : 'Manage who can contribute to this workspace'}
          </p>
        </div>

        {/* Add button — only shown when there are existing contributors */}
        {hasContributors && !loading && (
          <button
            type="button"
            onClick={handleOpenDialog}
            className={clsx(
              'shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md',
              'text-sm font-medium text-text-inverse bg-accent',
              'hover:bg-accent-hover transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add contributor
          </button>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div
          role="status"
          aria-label="Loading contributors"
          className="flex flex-col gap-3"
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="card flex items-start gap-4 animate-pulse"
              aria-hidden="true"
            >
              <div className="w-10 h-10 rounded-full bg-surface-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded bg-surface-muted" />
                <div className="h-2.5 w-48 rounded bg-surface-muted" />
                <div className="h-2.5 w-24 rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          role="alert"
          className="card border-red-200 bg-red-50 text-sm text-red-700"
        >
          <p className="font-medium mb-1">Failed to load contributors</p>
          <p className="text-xs">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !hasContributors && (
        <ContributorEmptyState onAdd={handleOpenDialog} />
      )}

      {/* Contributor list */}
      {!loading && !error && hasContributors && (
        <ContributorList
          contributors={contributors}
          onArchive={archiveContributor}
        />
      )}

      {/* Add contributor dialog */}
      <ContributorFormDialog
        open={dialogOpen}
        submitLabel="Add contributor"
        submitting={submitting}
        error={submitError}
        onSubmit={handleSubmit}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
