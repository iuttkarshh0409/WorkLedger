/**
 * main.tsx
 *
 * Application entry point.
 *
 * Responsibilities (in order):
 *   1. Import global styles so Tailwind base layers apply before React renders.
 *   2. Locate the #root DOM element — fail fast if absent.
 *   3. Construct the full dependency graph via createApplicationComposition().
 *      If storage is unavailable the composition throws before React mounts,
 *      which surfaces a clear startup error rather than a silent failure.
 *   4. Pass the composition to <App> and mount React.
 *
 * App.tsx remains a pure presentation component and does not
 * construct any dependencies of its own.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { App } from '@app/App';
import { createApplicationComposition } from '@app/composition';
import type { ApplicationComposition } from '@app/composition';

// ── 1. Locate root element ────────────────────────────────────────────────────

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element #root not found. Verify index.html contains <div id="root">.',
  );
}

// ── 2. Construct the dependency graph ─────────────────────────────────────────

let composition: ApplicationComposition | null = null;

try {
  composition = createApplicationComposition();
} catch (error) {
  console.error('[WorkLedger] Application failed to start:', error);
  rootElement.innerHTML =
    '<div style="padding:2rem;font-family:sans-serif;color:#dc2626;">' +
    '<strong>WorkLedger failed to start.</strong><br>' +
    'Storage is unavailable in this environment.' +
    '</div>';
}

// ── 3. Mount React ────────────────────────────────────────────────────────────
// Only mount if composition succeeded. The DOM error message above is
// sufficient for the user when it does not.

if (composition !== null) {
  createRoot(rootElement).render(
    <StrictMode>
      <App composition={composition} />
    </StrictMode>,
  );
}
