/**
 * Shared Utilities
 *
 * Pure utility functions with no side effects and no business logic.
 * Business calculations belong in domain engines, not here.
 */

/**
 * cn — class name helper
 *
 * Combines clsx with a stable import path.
 * Use `cn()` throughout the codebase instead of importing clsx directly,
 * so the underlying utility can be swapped in one place if needed.
 */
export { clsx as cn } from 'clsx';
