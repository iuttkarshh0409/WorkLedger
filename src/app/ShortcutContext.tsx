/**
 * ShortcutContext
 *
 * Allows feature pages to register handlers for global keyboard shortcuts.
 * AppShell reads these handlers and passes them to useKeyboardShortcuts.
 *
 * Architecture:
 * - AppShell does not know about Contributors or Assignments.
 * - Feature pages register their own handlers via useRegisterShortcuts().
 * - The context acts as a registry — last registration wins per key.
 * - Handlers are cleared when a page unmounts (useEffect cleanup).
 *
 * @see src/hooks/useKeyboardShortcuts.ts
 * @see docs/06.5_component_architecture.md (AppShell boundary)
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShortcutHandlers {
  onNewAssignment:  (() => void) | null;
  onNewContributor: (() => void) | null;
}

interface ShortcutContextValue {
  handlers:   ShortcutHandlers;
  register:   (handlers: Partial<ShortcutHandlers>) => () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<ShortcutHandlers>({
    onNewAssignment:  null,
    onNewContributor: null,
  });

  const register = useCallback(
    (incoming: Partial<ShortcutHandlers>): (() => void) => {
      if (incoming.onNewAssignment  !== undefined) handlersRef.current.onNewAssignment  = incoming.onNewAssignment;
      if (incoming.onNewContributor !== undefined) handlersRef.current.onNewContributor = incoming.onNewContributor;

      return () => {
        // On unmount: clear only the handlers this registration set
        if (incoming.onNewAssignment  !== undefined) handlersRef.current.onNewAssignment  = null;
        if (incoming.onNewContributor !== undefined) handlersRef.current.onNewContributor = null;
      };
    },
    [],
  );

  const value: ShortcutContextValue = {
    get handlers() { return handlersRef.current; },
    register,
  };

  return (
    <ShortcutContext.Provider value={value}>
      {children}
    </ShortcutContext.Provider>
  );
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * useShortcutRegistry
 * Used by AppShell to read the currently registered handlers.
 */
export function useShortcutRegistry(): ShortcutContextValue {
  const ctx = useContext(ShortcutContext);
  if (!ctx) throw new Error('useShortcutRegistry must be inside ShortcutProvider');
  return ctx;
}

/**
 * useRegisterShortcuts
 * Used by feature pages to register their shortcut handlers.
 * Handlers are automatically unregistered when the calling component unmounts.
 */
import { useEffect } from 'react';

export function useRegisterShortcuts(handlers: Partial<ShortcutHandlers>): void {
  const ctx = useContext(ShortcutContext);

  useEffect(() => {
    if (!ctx) return;
    return ctx.register(handlers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx]);
}
