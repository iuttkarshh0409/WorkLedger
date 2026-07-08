import { useState, useEffect } from 'react';
import { useSession } from '@app/SessionContext';
import { useServices } from '@hooks/useServices';
import { isDomainError } from '@lib/errors';
import { ContributorRole, WorkspaceStatus } from '@domain';
import type { AnyDomainError } from '@domain';
import { clsx } from 'clsx';

function formatDomainError(error: AnyDomainError): string {
  switch (error.kind) {
    case 'ValidationError':
      return error.errors.join(', ');
    case 'NotFoundError':
      return `${error.entity} with ID ${error.id} was not found.`;
    case 'ConflictError':
      return error.message;
    case 'PermissionError':
      return `Permission Denied for ${error.action}: ${error.reason}`;
    case 'DomainError':
      return error.message;
    default:
      return 'An unexpected error occurred.';
  }
}

export function SettingsPage() {
  const { session, logout } = useSession();
  const {
    workspace: workspaceService,
    contributor: contributorService,
    assignment: assignmentService,
    milestone: milestoneService,
  } = useServices();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [workspace, setWorkspace] = useState<any>(null);
  const [stats, setStats] = useState({ contributors: 0, assignments: 0, milestones: 0 });
  const [ownerName, setOwnerName] = useState('Unknown Owner');
  const [obsEnabled, setObsEnabled] = useState<boolean | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadData = async () => {
    if (!session?.workspaceId) return;
    try {
      setLoading(true);
      setError(null);

      const [wsResult, contributorsResult, assignmentsResult, milestonesResult] = await Promise.all([
        workspaceService.getWorkspaceById(session.workspaceId),
        contributorService.getContributorsByWorkspace(session.workspaceId),
        assignmentService.getAssignmentsByWorkspace(session.workspaceId),
        milestoneService.getMilestonesByWorkspace(session.workspaceId),
      ]);

      if (isDomainError(wsResult)) throw new Error('Failed to load workspace.');
      if (isDomainError(contributorsResult)) throw new Error('Failed to load contributors.');
      if (isDomainError(assignmentsResult)) throw new Error('Failed to load assignments.');
      if (isDomainError(milestonesResult)) throw new Error('Failed to load milestones.');

      setWorkspace(wsResult);
      if (wsResult) {
        setEditName(wsResult.name);
        setEditDescription(wsResult.description);

        const owner = contributorsResult.find((c) => c.id === wsResult.ownerId);
        setOwnerName(owner ? owner.name : 'Unknown Owner');
      }

      setStats({
        contributors: contributorsResult.length,
        assignments: assignmentsResult.length,
        milestones: milestonesResult.length,
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load workspace settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Check observability health
    fetch('http://localhost:3001/health')
      .then((res) => {
        setObsEnabled(res.ok);
      })
      .catch(() => {
        setObsEnabled(false);
      });
  }, [session?.workspaceId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !session) return;
    if (!editName.trim()) {
      setSaveError('Workspace name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const result = await workspaceService.updateWorkspace(
        workspace.id,
        {
          name: editName.trim(),
          description: editDescription.trim(),
          updatedAt: new Date().toISOString(),
        },
        session.contributorId
      );

      if (isDomainError(result)) {
        setSaveError(formatDomainError(result));
        return;
      }

      setWorkspace(result);
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (workspace) {
      setEditName(workspace.name);
      setEditDescription(workspace.description);
    }
    setSaveError(null);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-surface-secondary min-h-[400px]">
        <div className="text-sm text-text-muted animate-pulse font-medium">
          Loading workspace configuration...
        </div>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="p-6 bg-surface-secondary flex-1">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-red-800">Error Loading Settings</h3>
          <p className="mt-1 text-xs text-red-700">{error || 'Workspace could not be found.'}</p>
          <button
            onClick={() => loadData()}
            className="mt-3 inline-flex items-center text-xs font-semibold text-red-800 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isOwner = session?.role === ContributorRole.Owner;

  return (
    <div className="p-6 bg-surface-secondary flex-1 overflow-y-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspace Configuration card */}
        <div className="lg:col-span-2 card space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Workspace Profile</h2>
              <p className="text-xs text-text-muted mt-0.5">
                General details and information about this workspace.
              </p>
            </div>
            {isOwner && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-md border border-border bg-surface text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors duration-150"
              >
                Edit Profile
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="editWorkspaceName" className="block text-xs font-semibold text-text-secondary mb-1">
                  Workspace Name
                </label>
                <input
                  id="editWorkspaceName"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  disabled={saving}
                  placeholder="Workspace Name"
                />
              </div>

              <div>
                <label htmlFor="editWorkspaceDesc" className="block text-xs font-semibold text-text-secondary mb-1">
                  Description
                </label>
                <textarea
                  id="editWorkspaceDesc"
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-surface text-text-primary focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  disabled={saving}
                  placeholder="Brief description of the workspace purpose"
                />
              </div>

              {saveError && (
                <div role="alert" className="text-xs text-danger font-medium">
                  {saveError}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-accent text-white text-xs font-semibold hover:bg-accent-hover disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="px-4 py-2 rounded-md border border-border text-xs font-semibold text-text-secondary hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="block text-xs font-semibold text-text-muted">Name</span>
                <span className="text-text-primary font-medium">{workspace.name || '—'}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-text-muted">Status</span>
                <span
                  className={clsx(
                    'inline-flex items-center rounded-md px-2 py-0.5 mt-0.5 text-xs font-medium ring-1 ring-inset',
                    workspace.status === WorkspaceStatus.Active
                      ? 'bg-green-50 text-green-700 ring-green-600/20'
                      : 'bg-surface-muted text-text-muted ring-border'
                  )}
                >
                  {workspace.status}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="block text-xs font-semibold text-text-muted">Description</span>
                <p className="text-text-secondary whitespace-pre-line mt-0.5 text-xs leading-relaxed">
                  {workspace.description || 'No description provided.'}
                </p>
              </div>
              <div>
                <span className="block text-xs font-semibold text-text-muted">Owner</span>
                <span className="text-text-primary font-medium">{ownerName}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-text-muted">Created</span>
                <span className="text-text-primary font-medium">
                  {workspace.createdAt
                    ? new Date(workspace.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Workspace Statistics card */}
        <div className="card space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-text-primary">Statistics</h2>
            <p className="text-[11px] text-text-muted">Real-time counts of workspace metadata.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-surface-secondary rounded-lg p-3 border border-border">
              <span className="block text-lg font-bold text-text-primary">{stats.contributors}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Members</span>
            </div>
            <div className="bg-surface-secondary rounded-lg p-3 border border-border">
              <span className="block text-lg font-bold text-text-primary">{stats.assignments}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Tasks</span>
            </div>
            <div className="bg-surface-secondary rounded-lg p-3 border border-border">
              <span className="block text-lg font-bold text-text-primary">{stats.milestones}</span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Milestones</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Session card */}
        <div className="card space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Active Session</h2>
              <p className="text-[11px] text-text-muted">Information about your current session.</p>
            </div>
            <button
              onClick={logout}
              className="px-2.5 py-1.5 rounded-md border border-border bg-surface text-[10px] font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
            >
              Switch User
            </button>
          </div>
          <div className="space-y-3 text-xs leading-relaxed">
            <div>
              <span className="block text-[10px] font-semibold text-text-muted">Contributor</span>
              <span className="text-text-primary font-medium">{session?.name}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-text-muted">Email</span>
              <span className="text-text-primary font-medium">{session?.email}</span>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-text-muted">Workspace context</span>
              <span className="text-text-primary font-medium">{workspace.name}</span>
            </div>
          </div>
        </div>

        {/* Developer Info card */}
        <div className="lg:col-span-2 card space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-text-primary">Developer Information</h2>
            <p className="text-[11px] text-text-muted">Debugging and application diagnostic metadata.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block text-[10px] font-semibold text-text-muted">Session ID</span>
              <code className="bg-surface-secondary px-1.5 py-0.5 rounded border border-border select-all break-all text-[11px]">
                {session?.sessionId || '—'}
              </code>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-text-muted">Workspace ID</span>
              <code className="bg-surface-secondary px-1.5 py-0.5 rounded border border-border select-all break-all text-[11px]">
                {workspace.id}
              </code>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-text-muted">Current Role</span>
              <code className="bg-surface-secondary px-1.5 py-0.5 rounded border border-border text-[11px]">
                {session?.role}
              </code>
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-text-muted">Application Version</span>
              <code className="bg-surface-secondary px-1.5 py-0.5 rounded border border-border text-[11px]">
                v{import.meta.env.PACKAGE_VERSION || '0.1.0'}
              </code>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <span className="text-[10px] font-semibold text-text-muted">Observability Backend Status:</span>
              <span
                className={clsx(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                  obsEnabled === true
                    ? 'bg-green-50 text-green-700 ring-green-600/20'
                    : obsEnabled === false
                    ? 'bg-red-50 text-red-700 ring-red-600/20'
                    : 'bg-surface-muted text-text-muted ring-border animate-pulse'
                )}
              >
                {obsEnabled === true ? 'Active' : obsEnabled === false ? 'Offline' : 'Checking...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
