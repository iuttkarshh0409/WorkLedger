/**
 * AppShell
 *
 * The persistent application frame that surrounds every workspace screen.
 *
 * Responsibilities (per 06.5_component_architecture.md Layer 1):
 * - Compose Sidebar and Header.
 * - Manage sidebar collapsed state.
 * - Register global keyboard shortcuts.
 * - Host the ShortcutReferenceDialog.
 * - Provide a stable slot for main content.
 *
 * Architectural boundary — AppShell must never know about:
 * - Contributors, Assignments, Reviews, Milestones, or any domain concept.
 * - Business rules, services, or repositories.
 * AppShell knows only: Sidebar, Header, ShortcutReferenceDialog, and a children slot.
 */

import { useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { Sidebar } from '@shared/components/Sidebar';
import { Header } from '@shared/components/Header';
import { ShortcutReferenceDialog } from '@shared/components/ShortcutReferenceDialog';
import { useShortcutRegistry } from '@app/ShortcutContext';
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' && window.innerWidth < 768,
  );
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const { handlers } = useShortcutRegistry();
  const noop = useCallback(() => {}, []);

  useKeyboardShortcuts({
    onNewAssignment:  handlers.onNewAssignment  ?? noop,
    onNewContributor: handlers.onNewContributor ?? noop,
    onShowShortcuts:  () => setShortcutsOpen(true),
  });

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className={clsx(
          'sr-only focus:not-sr-only',
          'absolute top-2 left-2 z-50 px-4 py-2 rounded-md',
          'text-sm font-medium text-text-inverse bg-accent',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
      >
        Skip to main content
      </a>

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto focus:outline-none"
        >
          {children}
        </main>
      </div>

      <ShortcutReferenceDialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}
