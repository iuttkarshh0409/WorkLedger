import type { IReviewRepository, Review, AnyDomainError, EntityId } from '@domain';
import { request } from './baseClient';

type Res<T> = Promise<T | AnyDomainError>;

export class ReviewRepository implements IReviewRepository {
  async create(review: Review): Res<Review> {
    const isRevision =
      review.scores.technicalQuality === 0 &&
      review.scores.documentation === 0 &&
      review.scores.communication === 0 &&
      review.scores.ownership === 0 &&
      review.scores.problemSolving === 0 &&
      review.scores.timeliness === 0;

    if (isRevision) {
      return request<Review>('/reviews/revision', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId: review.assignmentId,
          submissionId: review.submissionId,
          feedback: review.feedback,
          reviewedOn: review.reviewedOn,
        }),
      });
    }

    return request<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(review),
    });
  }

  async update(review: Review): Res<Review> {
    return request<Review>(`/reviews/${review.id}`, {
      method: 'PUT',
      body: JSON.stringify(review),
    });
  }

  async findById(id: EntityId): Res<Review | null> {
    const res = await request<Review>(`/reviews/${id}`);
    if (res && (res as any).kind === 'NotFoundError') {
      return null;
    }
    return res as any;
  }

  async findByAssignment(assignmentId: EntityId): Res<Review[]> {
    return request<Review[]>(`/reviews/assignment/${assignmentId}`);
  }

  async findBySubmission(submissionId: EntityId): Res<Review | null> {
    const res = await request<Review>(`/reviews/submission/${submissionId}`);
    if (res && (res as any).kind === 'NotFoundError') {
      return null;
    }
    return res as any;
  }

  async findByReviewer(reviewerId: EntityId): Res<Review[]> {
    return request<Review[]>(`/reviews?reviewerId=${reviewerId}`);
  }

  async exists(id: EntityId): Res<boolean> {
    const r = await this.findById(id);
    if (!r || (r as any).kind) return false;
    return true;
  }
}
