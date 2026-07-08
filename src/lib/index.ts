/**
 * Lib
 *
 * Shared utility functions used across the application.
 *
 * Current exports:
 *   generateId            — UUID v4 generator for domain entities
 *   isDomainError         — union narrowing guard (ADR-001)
 *   assertSuccess         — assertion helper for test contexts
 *   validationError       — ValidationError factory
 *   notFound              — NotFoundError factory
 *   conflict              — ConflictError factory
 *   permissionDenied      — PermissionError factory
 *   domainError           — generic DomainError factory
 *   calculateOverallScore — Review score derivation (05_scoring_engine.md)
 */

export { generateId, overrideNextId } from './id';

export {
  isDomainError,
  assertSuccess,
  validationError,
  notFound,
  conflict,
  permissionDenied,
  domainError,
} from './errors';

export { calculateOverallScore } from './scoring';
export type { OverallScore } from './scoring';

export { getOrCreateDemoWorkspace, DEMO_OWNER_ID } from './bootstrap';

export { formatRelativeTime, formatExactTime } from './time';
