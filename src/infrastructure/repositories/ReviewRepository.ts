/**
 * ReviewRepository
 *
 * Concrete implementation of IReviewRepository.
 * Persists Review entities using the injected IStorageProvider.
 *
 * Responsibilities:
 *   - Entity persistence and retrieval
 *   - Translation of StorageError → DomainError
 *
 * Not responsible for:
 *   - Authorisation (update is admin-only — enforced by services)
 *   - Score validation
 *   - Business rules
 *
 * @see src/domain/review/repository.ts (IReviewRepository)
 * @see docs/04.5_permission_model.md (Review Permissions — admin update)
 * @see docs/09_technical_architecture.md (Repository Pattern)
 */

import type { IReviewRepository } from '@domain';
import type { Review } from '@domain';
import type { AnyDomainError } from '@domain';
import type { EntityId } from '@domain';
import type { IStorageProvider } from '../storage';
import { STORAGE_NAMESPACES } from './namespaces';
import { translateStorageError } from './translateStorageError';

type Res<T> = Promise<T | AnyDomainError>;

export class ReviewRepository implements IReviewRepository {
  private readonly namespace = STORAGE_NAMESPACES.reviews;

  constructor(private readonly storage: IStorageProvider) {}

  // ─── Writes ────────────────────────────────────────────────────────────────

  async create(review: Review): Res<Review> {
    const result = await this.storage.set(
      this.namespace,
      review.id,
      review,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'ReviewRepository.create');
    }
    return review;
  }

  /**
   * Persists an administrative correction to a published Review.
   * Services must enforce authorisation before calling this method.
   *
   * @see docs/04.5_permission_model.md (Administrative Corrections)
   */
  async update(review: Review): Res<Review> {
    const result = await this.storage.set(
      this.namespace,
      review.id,
      review,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'ReviewRepository.update');
    }
    return review;
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  async findById(id: EntityId): Res<Review | null> {
    const result = await this.storage.get<Review>(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'ReviewRepository.findById');
    }
    return result.value;
  }

  async findByAssignment(assignmentId: EntityId): Res<Review[]> {
    const result = await this.storage.list<Review>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'ReviewRepository.findByAssignment',
      );
    }
    return result.value.filter((r) => r.assignmentId === assignmentId);
  }

  async findBySubmission(submissionId: EntityId): Res<Review | null> {
    const result = await this.storage.list<Review>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'ReviewRepository.findBySubmission',
      );
    }
    return result.value.find((r) => r.submissionId === submissionId) ?? null;
  }

  async findByReviewer(reviewerId: EntityId): Res<Review[]> {
    const result = await this.storage.list<Review>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'ReviewRepository.findByReviewer',
      );
    }
    return result.value.filter((r) => r.reviewedBy === reviewerId);
  }

  async exists(id: EntityId): Res<boolean> {
    const result = await this.storage.has(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'ReviewRepository.exists');
    }
    return result.value;
  }
}
