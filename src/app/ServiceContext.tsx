/**
 * ServiceContext
 *
 * Provides the ApplicationServices object to the React component tree.
 *
 * Rules:
 * - No service construction occurs here. Services are constructed in
 *   main.tsx via createApplicationComposition() and passed in as props.
 * - Components access services through useServices(), not this context directly.
 * - This context is the boundary between the composition root and the UI layer.
 *
 * @see src/app/composition.ts (ApplicationComposition)
 * @see src/hooks/useServices.ts (useServices hook)
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { ApplicationServices } from './composition';

// ─── Context ─────────────────────────────────────────────────────────────────

const ServiceContext = createContext<ApplicationServices | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

interface ServiceProviderProps {
  services: ApplicationServices;
  children: ReactNode;
}

export function ServiceProvider({ services, children }: ServiceProviderProps) {
  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useServiceContext
 *
 * Internal hook — returns the raw context value.
 * Prefer useServices() from src/hooks/useServices.ts for component use.
 */
export function useServiceContext(): ApplicationServices {
  const context = useContext(ServiceContext);
  if (context === null) {
    throw new Error(
      'useServiceContext must be used within a ServiceProvider. ' +
      'Ensure ServiceProvider wraps the component tree in App.tsx.',
    );
  }
  return context;
}
