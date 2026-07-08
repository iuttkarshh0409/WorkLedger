/**
 * AnalyticsPage
 *
 * Derived metrics and insights for the Workspace.
 *
 * Future implementation will display:
 * - Workspace-level metrics (completion rate, average score, pending reviews)
 * - Contributor performance trends
 * - Milestone progress and distribution
 *
 * All analytics are derived from source data — none are manually entered.
 * This page is a placeholder. Business logic will be implemented in a future milestone.
 */

import { PlaceholderPage } from '@shared/components/PlaceholderPage';

export function AnalyticsPage() {
  return (
    <PlaceholderPage
      title="Analytics"
      description="Workspace intelligence derived entirely from structured data. Analytics will reveal completion trends, Contributor performance, Milestone health, and growth patterns — all calculated automatically, never entered manually."
      milestone="Milestone 3"
    />
  );
}
