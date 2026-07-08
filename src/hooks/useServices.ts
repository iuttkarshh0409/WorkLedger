/**
 * useServices
 *
 * Returns the ApplicationServices instance from the ServiceContext.
 *
 * Usage:
 *   const { contributor, assignment } = useServices();
 *   const contributors = await contributor.getContributorsByWorkspace(id);
 *
 * Must be called inside a component tree wrapped by ServiceProvider.
 */

import { useServiceContext } from '@app/ServiceContext';
import type { ApplicationServices } from '@app/composition';

export function useServices(): ApplicationServices {
  return useServiceContext();
}
