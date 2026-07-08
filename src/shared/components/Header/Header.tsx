/**
 * Header
 *
 * Top navigation bar for the WorkLedger workspace.
 *
 * Responsibilities (Milestone 1):
 * - Display the active module title derived from the current route.
 * - Provide a placeholder global search input.
 * - Contain placeholder notification and profile areas.
 *
 * Future milestones:
 * - Wire global search to a real search service.
 * - Add notification badge and notification drawer.
 * - Add user profile menu with workspace switcher.
 */

import { useLocation, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { Icon } from '@shared/components/Icon';
import { PRIMARY_NAV_ITEMS } from '@shared/constants/navigation';
import { useSession } from '@app/SessionContext';
import { contributorProfilePath } from '@shared/constants/routes';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve a human-readable title for the current pathname.
 * Falls back to "WorkLedger" when no nav item matches.
 */
function resolvePageTitle(pathname: string): string {
  const match = PRIMARY_NAV_ITEMS.find((item) =>
    pathname.startsWith(item.path),
  );
  return match?.label ?? 'WorkLedger';
}

// ─── Component ───────────────────────────────────────────────────────────────

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { pathname } = useLocation();
  const pageTitle = resolvePageTitle(pathname);
  const { session, logout } = useSession();

  const initials = session
    ? session.name
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'WL';

  return (
    <header
      className={clsx(
        'flex items-center gap-4 h-14 px-6',
        'bg-surface border-b border-border shrink-0',
        className,
      )}
    >
      {/* Page title */}
      <h1 className="text-sm font-semibold text-text-primary mr-auto">
        {pageTitle}
      </h1>

      {/* Global search — placeholder */}
      <div className="relative hidden sm:flex items-center">
        <div
          role="search"
          aria-label="Global search (not yet available)"
          className={clsx(
            'flex items-center gap-2 h-8 px-3 rounded-md',
            'border border-border bg-surface-secondary',
            'text-sm text-text-muted cursor-not-allowed',
            'w-56',
          )}
        >
          <Icon name="search" size={14} className="text-text-muted shrink-0" />
          <span className="truncate select-none">
            Global Search (Coming Soon)
          </span>
        </div>
      </div>

      {/* Notification placeholder */}
      <button
        type="button"
        disabled
        aria-label="Notifications (coming soon)"
        title="Notifications (coming soon)"
        className={clsx(
          'flex items-center justify-center w-8 h-8 rounded-md',
          'text-text-muted cursor-not-allowed',
          'border border-border',
        )}
      >
        {/* Bell icon — inline to avoid extra import */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </button>

      {/* User profile and details */}
      {session && (
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <Link
            to={contributorProfilePath(session.contributorId)}
            title="View Profile"
            className="flex items-center gap-2 hover:opacity-85 transition-opacity"
          >
            <div
              aria-label={`Logged in as ${session.name}`}
              className={clsx(
                'flex items-center justify-center w-8 h-8 rounded-full',
                'bg-accent-subtle text-accent text-xs font-semibold',
                'border border-border select-none shrink-0',
              )}
            >
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left mr-2">
              <span className="text-xs font-semibold text-text-primary leading-tight max-w-[120px] truncate hover:text-accent">
                {session.name}
              </span>
              <span className="text-[10px] text-text-secondary font-medium leading-none">
                {session.role}
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            aria-label="Switch User"
            title="Switch User"
            className={clsx(
              'flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-surface',
              'text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted',
              'transition-colors duration-150',
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={12}
              height={12}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden sm:inline">Switch User</span>
          </button>
        </div>
      )}
    </header>
  );
}
