/**
 * Shared Components
 *
 * Central barrel export for all reusable, business-logic-free components.
 *
 * Import from '@shared/components' rather than deep paths where possible.
 *
 * Components implemented in Milestone 1:
 *   - Icon
 *   - Sidebar
 *   - Header
 *   - AppShell
 *   - WorkspaceLayout
 *   - PlaceholderPage
 *
 * Future milestones will add:
 *   - Cards (ContributorCard, AssignmentCard, ReviewCard, MetricCard)
 *   - Badges (StatusBadge, PriorityBadge)
 *   - Tables
 *   - Forms
 *   - Dialogs
 *   - EmptyState
 *   - ActivityFeed
 *   - Timeline
 *   - ScoreIndicator
 *   - ContributorDNA
 *   - ProgressRing
 */

export { Icon } from './Icon';
export type { IconName } from './Icon';
export { Sidebar } from './Sidebar';
export { Header } from './Header';
export { AppShell } from './AppShell';
export { WorkspaceLayout } from './WorkspaceLayout';
export { PlaceholderPage } from './PlaceholderPage';
export { AccordionCard } from './AccordionCard';
export { ConfirmDialog } from './ConfirmDialog';
export { ErrorBoundary } from './ErrorBoundary';
