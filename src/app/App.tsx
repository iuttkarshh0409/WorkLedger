/**
 * App
 *
 * Root application component.
 *
 * Responsibilities:
 * - Receive the pre-constructed ApplicationComposition from main.tsx.
 * - Wrap the application in ThemeProvider.
 * - Provide ApplicationServices to the component tree via ServiceProvider.
 * - Mount the React Router RouterProvider.
 *
 * App is a presentation component. It constructs nothing — it only wires
 * the already-constructed composition into the React layer.
 */

import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './ThemeProvider';
import { ServiceProvider } from './ServiceContext';
import { ShortcutProvider } from './ShortcutContext';
import { SessionProvider } from './SessionContext';
import { HistoricalModeProvider } from './HistoricalModeContext';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { router } from './router';
import type { ApplicationComposition } from './composition';

interface AppProps {
  composition: ApplicationComposition;
}

export function App({ composition }: AppProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ServiceProvider services={composition.services}>
          <SessionProvider>
            <HistoricalModeProvider>
              <ShortcutProvider>
                <RouterProvider router={router} />
              </ShortcutProvider>
            </HistoricalModeProvider>
          </SessionProvider>
        </ServiceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
