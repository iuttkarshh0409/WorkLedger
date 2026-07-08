/**
 * useKeyboardShortcuts
 *
 * Registers global keyboard shortcuts for the workspace.
 *
 * Active shortcuts:
 *   N       — New Assignment (calls onNewAssignment)
 *   C       — New Contributor (calls onNewContributor)
 *   /       — Focus the global search input (if present in the DOM)
 *   Escape  — handled natively by <dialog> elements; not registered here
 *
 * Safety rules:
 * - Shortcuts are suppressed when the user is typing in an input,
 *   textarea, or contenteditable element.
 * - Shortcuts are suppressed when a <dialog> is open (checked via
 *   document.querySelector('dialog[open]')).
 * - Modifier keys (Ctrl, Alt, Meta) suppress shortcuts so they don't
 *   conflict with OS or browser shortcuts.
 *
 * @see docs/06_ui_architecture.md (Keyboard shortcuts)
 */

import { useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KeyboardShortcutHandlers {
  onNewAssignment:  () => void;
  onNewContributor: () => void;
  onShowShortcuts:  () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    tag === 'select' ||
    target.isContentEditable
  );
}

function isDialogOpen(): boolean {
  return document.querySelector('dialog[open]') !== null;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useKeyboardShortcuts({
  onNewAssignment,
  onNewContributor,
  onShowShortcuts,
}: KeyboardShortcutHandlers): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Suppress when modifier keys are held
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Suppress when typing in a form field
      if (isTypingTarget(e.target)) return;

      // Suppress when a dialog is open (dialogs handle their own keyboard)
      if (isDialogOpen()) return;      switch (e.key) {
        case 'n':
        case 'N':
          e.preventDefault();
          onNewAssignment();
          break;

        case 'c':
        case 'C':
          e.preventDefault();
          onNewContributor();
          break;

        case '?':
          e.preventDefault();
          onShowShortcuts();
          break;

        case '/': {
          e.preventDefault();
          // Focus the first visible search input in the page
          const searchInput = document.querySelector<HTMLInputElement>(
            'input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]',
          );
          searchInput?.focus();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewAssignment, onNewContributor]);
}
