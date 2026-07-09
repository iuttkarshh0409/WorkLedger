import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useServices } from '@hooks/useServices';
import { useSession } from '@app/SessionContext';
import { ContributorRole, Workspace, WorkspaceStatus } from '@domain';
import { isDomainError } from '@lib/errors';
import { DEMO_OWNER_ID } from '@lib';
import { logEvent } from '@infrastructure/logging';

export function DemoEntryPage() {
  const navigate = useNavigate();
  const { workspace: workspaceService, contributor: contributorService } = useServices();
  const { login } = useSession();

  // Role selection: Owner, Reviewer, Contributor
  const [role, setRole] = useState<ContributorRole>(ContributorRole.Owner);

  // Owner action toggle: 'create' a new workspace or 'join' an existing one
  const [ownerAction, setOwnerAction] = useState<'create' | 'join'>('create');

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');

  // Workspaces list
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  // Form submission and error states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const savedToast = sessionStorage.getItem('wl:toast');
    if (savedToast) {
      setToast(savedToast);
      sessionStorage.removeItem('wl:toast');
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Load existing workspaces on mount and service dependencies
  useEffect(() => {
    setLoadingWorkspaces(true);
    setError(null);
    workspaceService.getAllWorkspaces()
      .then((result) => {
        if (isDomainError(result)) {
          setError('Failed to fetch existing workspaces.');
        } else {
          setWorkspaces(result);
          if (result.length > 0) {
            setSelectedWorkspaceId(result[0].id);
          } else {
            setSelectedWorkspaceId('');
          }
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'An error occurred.');
      })
      .finally(() => {
        setLoadingWorkspaces(false);
      });
  }, [workspaceService]);

  const handleRoleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRole(e.target.value as ContributorRole);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (role === ContributorRole.Owner && ownerAction === 'create') {
        if (!workspaceName.trim()) {
          setError('Workspace Name is required.');
          setSubmitting(false);
          return;
        }

        // Owner onboarding steps (create):
        // 1. Create Workspace
        const workspaceResult = await workspaceService.createWorkspace({
          name: workspaceName.trim(),
          description: `Workspace for ${workspaceName.trim()}`,
          ownerId: DEMO_OWNER_ID,
          status: WorkspaceStatus.Active,
          ownerName: name.trim(),
          ownerEmail: email.trim(),
        });

        if (isDomainError(workspaceResult)) {
          setError(workspaceResult.kind === 'ValidationError' ? workspaceResult.errors.join(' ') : 'Failed to create workspace.');
          setSubmitting(false);
          return;
        }

        // Log WorkspaceCreated
        await logEvent({
          message: `${name.trim()} created workspace '${workspaceResult.name}'.`,
          workspace: {
            workspaceId: workspaceResult.id,
            workspaceName: workspaceResult.name,
          },
          actor: {
            contributorId: DEMO_OWNER_ID,
            contributorName: name.trim(),
            contributorRole: ContributorRole.Owner,
          },
          event: {
            eventCode: 'WorkspaceCreated',
            eventLabel: 'Workspace Created',
          },
          entity: {
            entityType: 'Workspace',
            entityId: workspaceResult.id,
            entityName: workspaceResult.name,
          },
          state: {
            after: {
              id: workspaceResult.id,
              name: workspaceResult.name,
              description: workspaceResult.description,
              ownerId: workspaceResult.ownerId,
              status: workspaceResult.status,
            },
          },
          details: {
            metadata: {
              description: workspaceResult.description,
              createdBy: name.trim(),
            },
          },
        });

        // Log ContributorAdded
        await logEvent({
          message: `${name.trim()} joined workspace '${workspaceResult.name}' as Workspace Owner.`,
          workspace: {
            workspaceId: workspaceResult.id,
            workspaceName: workspaceResult.name,
          },
          actor: {
            contributorId: DEMO_OWNER_ID,
            contributorName: name.trim(),
            contributorRole: ContributorRole.Owner,
          },
          event: {
            eventCode: 'ContributorAdded',
            eventLabel: 'Contributor Added',
          },
          entity: {
            entityType: 'Contributor',
            entityId: DEMO_OWNER_ID,
            entityName: name.trim(),
          },
          state: {
            after: {
              id: DEMO_OWNER_ID,
              workspaceId: workspaceResult.id,
              name: name.trim(),
              email: email.trim(),
              role: ContributorRole.Owner,
              status: 'Active',
            },
          },
          details: {
            metadata: {
              email: email.trim(),
              role: ContributorRole.Owner,
              invitedBy: 'System Bootstrap',
            },
          },
        });

        // 3. Persist Session
        login({
          contributorId: DEMO_OWNER_ID,
          workspaceId: workspaceResult.id,
          role: ContributorRole.Owner,
          name: name.trim(),
          email: email.trim(),
        });

      } else {
        // Joining or logging back into an existing workspace (as Owner, Reviewer, or Contributor)
        if (!selectedWorkspaceId) {
          setError('Please select an existing workspace.');
          setSubmitting(false);
          return;
        }

        // Find workspace name for metadata
        const targetWorkspace = workspaces.find((ws) => ws.id === selectedWorkspaceId);
        const targetWorkspaceName = targetWorkspace ? targetWorkspace.name : 'Unknown Workspace';

        // Check if contributor with this email already exists in the selected workspace
        const existingContributors = await contributorService.getContributorsByWorkspace(selectedWorkspaceId);
        if (isDomainError(existingContributors)) {
          setError('Failed to query workspace contributors.');
          setSubmitting(false);
          return;
        }

        const match = existingContributors.find(
          (c) => c.email.toLowerCase().trim() === email.toLowerCase().trim()
        );

        if (match) {
          // Log in with existing contributor details
          login({
            contributorId: match.id,
            workspaceId: selectedWorkspaceId,
            role: match.role,
            name: match.name,
            email: match.email,
          });
        } else {
          // Not found, perform new registration/sign-up
          const contributorResult = await contributorService.addContributor(
            {
              workspaceId: selectedWorkspaceId,
              name: name.trim(),
              email: email.trim(),
              role,
            },
            'system-bootstrap'
          );

          if (isDomainError(contributorResult)) {
            setError(contributorResult.kind === 'ConflictError' ? contributorResult.message : 'Failed to join workspace.');
            setSubmitting(false);
            return;
          }

          // Log ContributorAdded
          await logEvent({
            message: `${contributorResult.name} joined workspace '${targetWorkspaceName}' as ${contributorResult.role}.`,
            workspace: {
              workspaceId: selectedWorkspaceId,
              workspaceName: targetWorkspaceName,
            },
            actor: {
              contributorId: contributorResult.id,
              contributorName: contributorResult.name,
              contributorRole: contributorResult.role,
            },
            event: {
              eventCode: 'ContributorAdded',
              eventLabel: 'Contributor Added',
            },
            entity: {
              entityType: 'Contributor',
              entityId: contributorResult.id,
              entityName: contributorResult.name,
            },
            state: {
              after: {
                id: contributorResult.id,
                workspaceId: contributorResult.workspaceId,
                name: contributorResult.name,
                email: contributorResult.email,
                role: contributorResult.role,
                status: contributorResult.status,
              },
            },
            details: {
              metadata: {
                email: contributorResult.email,
                role: contributorResult.role,
                invitedBy: 'Self-Registration',
              },
            },
          });

          // Persist Session
          login({
            contributorId: contributorResult.id,
            workspaceId: selectedWorkspaceId,
            role,
            name: contributorResult.name,
            email: contributorResult.email,
          });
        }
      }

      // Onboarding complete, navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = clsx(
    'w-full rounded-md border border-border bg-surface px-3 py-2',
    'text-sm text-text-primary placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
    'transition-colors duration-150',
  );

  const labelClass = 'block text-xs font-medium text-text-secondary mb-1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary px-4 py-12">
      {toast && (
        <div
          role="alert"
          className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-lg animate-fade-in"
        >
          <svg className="h-5 w-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{toast}</span>
        </div>
      )}
      <div className="card w-full max-w-md bg-surface border border-border rounded-lg shadow-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-text-primary">Welcome to WorkLedger</h1>
          <p className="text-sm text-text-secondary mt-1">Please select your role and set up your session</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Role selector */}
          <div>
            <span className={labelClass}>Choose your Role</span>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[ContributorRole.Owner, ContributorRole.Reviewer, ContributorRole.Contributor].map((r) => (
                <label
                  key={r}
                  className={clsx(
                    'flex flex-col items-center justify-center p-3 rounded-md border text-center cursor-pointer transition-colors duration-150',
                    role === r
                      ? 'border-accent bg-accent-subtle text-accent'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-muted'
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={handleRoleChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className={labelClass}>
              Full Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className={fieldClass}
              disabled={submitting}
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className={labelClass}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jane@example.com"
              className={fieldClass}
              disabled={submitting}
            />
          </div>

          {/* Dynamic workspace input */}
          {role === ContributorRole.Owner ? (
            <div className="space-y-3">
              <div>
                <span className={labelClass}>Owner Action</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(['create', 'join'] as const).map((action) => (
                    <label
                      key={action}
                      className={clsx(
                        'flex items-center justify-center p-2 rounded-md border text-center cursor-pointer transition-colors duration-150 text-xs font-semibold',
                        ownerAction === action
                          ? 'border-accent bg-accent-subtle text-accent'
                          : 'border-border bg-surface text-text-secondary hover:bg-surface-muted'
                      )}
                    >
                      <input
                        type="radio"
                        name="ownerAction"
                        value={action}
                        checked={ownerAction === action}
                        onChange={(e) => setOwnerAction(e.target.value as 'create' | 'join')}
                        className="sr-only"
                      />
                      <span>{action === 'create' ? 'Create Workspace' : 'Join Workspace'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {ownerAction === 'create' ? (
                <div>
                  <label htmlFor="workspaceName" className={labelClass}>
                    Workspace Name
                  </label>
                  <input
                    id="workspaceName"
                    type="text"
                    required
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="e.g. Acme Team"
                    className={fieldClass}
                    disabled={submitting}
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="workspaceSelect" className={labelClass}>
                    Select Workspace
                  </label>
                  {loadingWorkspaces ? (
                    <div className="text-xs text-text-muted animate-pulse py-2">Loading workspaces...</div>
                  ) : workspaces.length === 0 ? (
                    <div className="text-xs text-danger py-2">
                      No active workspaces available. Please create one first.
                    </div>
                  ) : (
                    <select
                      id="workspaceSelect"
                      value={selectedWorkspaceId}
                      onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                      className={clsx(fieldClass, 'cursor-pointer')}
                      disabled={submitting}
                    >
                      {workspaces.map((ws) => (
                        <option key={ws.id} value={ws.id}>
                          {ws.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label htmlFor="workspaceSelect" className={labelClass}>
                Select Workspace
              </label>
              {loadingWorkspaces ? (
                <div className="text-xs text-text-muted animate-pulse py-2">Loading workspaces...</div>
              ) : workspaces.length === 0 ? (
                <div className="text-xs text-danger py-2">
                  No active workspaces available. Please onboard as an Owner first.
                </div>
              ) : (
                <select
                  id="workspaceSelect"
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className={clsx(fieldClass, 'cursor-pointer')}
                  disabled={submitting}
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              !name.trim() ||
              !email.trim() ||
              (role === ContributorRole.Owner
                ? (ownerAction === 'create' ? !workspaceName.trim() : !selectedWorkspaceId)
                : !selectedWorkspaceId)
            }
            className={clsx(
              'w-full px-4 py-2 rounded-md text-sm font-medium',
              'text-text-inverse bg-accent hover:bg-accent-hover',
              'transition-colors duration-150',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
            )}
          >
            {submitting ? 'Setting up...' : 'Enter WorkLedger'}
          </button>
        </form>
      </div>
    </div>
  );
}
export default DemoEntryPage;
