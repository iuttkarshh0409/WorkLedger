/**
 * ReviewActionPanel
 *
 * Renders the submission detail experience and ReviewForm for a selected Assignment.
 * Uses the canonical useReviews hook to trigger service layer mutations.
 */

import type { Assignment, Submission } from '@domain';
import { useReviews } from './useReviews';
import { SubmissionCard } from '../submissions/SubmissionCard';
import { ReviewForm } from './ReviewForm';
import { useServices } from '@hooks/useServices';

interface ReviewActionPanelProps {
  assignment: Assignment;
  submission: Submission;
  onAssignmentUpdated: (updated: Assignment) => void;
  onCancel: () => void;
}

export function ReviewActionPanel({
  assignment,
  submission,
  onAssignmentUpdated,
  onCancel,
}: ReviewActionPanelProps) {
  const { review: reviewService, assignment: assignmentService } = useServices();

  const {
    publishReview,
    requestRevision,
    submitting,
    submitError,
  } = useReviews(assignment.id, reviewService, assignmentService);

  const handlePublish = async (input: Parameters<typeof publishReview>[0]) => {
    const updated = await publishReview(input);
    if (updated) {
      onAssignmentUpdated(updated);
    }
  };

  const handleRevision = async (input: Parameters<typeof requestRevision>[0]) => {
    const updated = await requestRevision(input);
    if (updated) {
      onAssignmentUpdated(updated);
    }
  };

  return (
    <div className="space-y-6 pt-4 border-t border-border mt-4">
      <div className="bg-surface-secondary border border-border rounded-lg p-4">
        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
          Submitted Work
        </h4>
        <SubmissionCard submission={submission} revisionNumber={1} isLatest={true} />
      </div>

      <div className="bg-surface border border-border rounded-lg p-4">
        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
          Evaluate Submission
        </h4>
        <ReviewForm
          submissionId={submission.id}
          submitting={submitting}
          error={submitError}
          onPublish={handlePublish}
          onRevision={handleRevision}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}
