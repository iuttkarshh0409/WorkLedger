/**
 * Sidebar
 *
 * Persistent primary navigation for the WorkLedger workspace.
 *
 * Responsibilities (Milestone 1):
 * - Render all primary navigation items from navigation constants.
 * - Highlight the active route.
 * - Support collapsed (icon-only) state for narrower viewports.
 * - Remain entirely presentational — no business logic.
 *
 * Future milestones:
 * - Workspace switcher at the top.
 * - Notification badges on nav items.
 * - Keyboard-accessible expand/collapse.
 */

import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { Icon } from '@shared/components/Icon';
import { PRIMARY_NAV_ITEMS } from '@shared/constants/navigation';
import { useSession } from '@app/SessionContext';
import { ContributorRole } from '@domain';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const { session } = useSession();
  const userRole = session?.role ?? ContributorRole.Contributor;

  const filteredNavItems = PRIMARY_NAV_ITEMS.filter((item) => {
    switch (userRole) {
      case ContributorRole.Owner:
        return true;
      case ContributorRole.Reviewer:
        return item.label !== 'Settings';
      case ContributorRole.Contributor:
        return ['Dashboard', 'Assignments', 'Reviews', 'Activity'].includes(item.label);
      default:
        return ['Dashboard', 'Assignments', 'Reviews', 'Activity'].includes(item.label);
    }
  });

  return (
    <aside
      aria-label="Primary navigation"
      className={clsx(
        'flex flex-col h-full bg-surface border-r border-border',
        'transition-[width] duration-200 ease-in-out overflow-hidden',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Workspace identity */}
      <div
        className={clsx(
          'flex items-center h-14 border-b border-border shrink-0 px-4',
          collapsed ? 'justify-center' : 'justify-between gap-2',
        )}
      >
        {!collapsed && (
          <span className="text-sm font-semibold text-text-primary truncate">
            WorkLedger
          </span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={clsx(
            'flex items-center justify-center w-8 h-8 rounded-md',
            'text-text-secondary hover:text-text-primary hover:bg-surface-muted',
            'transition-colors duration-150 shrink-0',
          )}
        >
          <Icon
            name={collapsed ? 'menu' : 'chevronLeft'}
            size={18}
          />
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-md px-2 py-2',
                'text-sm font-medium transition-colors duration-150',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                isActive
                  ? 'bg-accent-subtle text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted',
                collapsed && 'justify-center px-2',
              )
            }
          >
            <Icon name={item.icon} size={18} />
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom spacer — future: workspace settings shortcut */}
      <div className="h-4 shrink-0" />
    </aside>
  );
}
