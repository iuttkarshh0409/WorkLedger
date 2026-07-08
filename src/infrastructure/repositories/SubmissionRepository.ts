/**
 * SubmissionRepository
 *
 * Concrete implementation of ISubmissionRepository.
 * Persists Submission entities using the injected IStorageProvider.
 *
 * Responsibilities:
 *   - Entity persistence and retrieval
 *   - Translation of StorageError → DomainError
 *
 * Not responsible for:
 *   - Revision history enforcement
 *   - Assignment state checks
 *   - Business rules
 *
 * Note: No update() method — each revision produces a new Submission record.
 * This is enforced by the interface and reflects the documented lifecycle.
 *
 * @see src/domain/submission/repository.ts (ISubmissionRepository)
 * @see docs/04_assignment_lifecycle.md (Revision Requested)
 * @see docs/09_technical_architecture.md (Repository Pattern)
 */

import type { ISubmissionRepository } from '@domain';
import type { Submission } from '@domain';
import type { AnyDomainError } from '@domain';
import type { EntityId } from '@domain';
import type { IStorageProvider } from '../storage';
import { STORAGE_NAMESPACES } from './namespaces';
import { translateStorageError } from './translateStorageError';

type Res<T> = Promise<T | AnyDomainError>;

export class SubmissionRepository implements ISubmissionRepository {
  private readonly namespace = STORAGE_NAMESPACES.submissions;

  constructor(private readonly storage: IStorageProvider) {}

  // ─── Writes ────────────────────────────────────────────────────────────────

  async create(submission: Submission): Res<Submission> {
    const result = await this.storage.set(
      this.namespace,
      submission.id,
      submission,
    );
    if (!result.ok) {
      return translateStorageError(result.error, 'SubmissionRepository.create');
    }
    return submission;
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  async findById(id: EntityId): Res<Submission | null> {
    const result = await this.storage.get<Submission>(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'SubmissionRepository.findById',
      );
    }
    return result.value;
  }

  async findByAssignment(assignmentId: EntityId): Res<Submission[]> {
    const result = await this.storage.list<Submission>(this.namespace);
    if (!result.ok) {
      return translateStorageError(
        result.error,
        'SubmissionRepository.findByAssignment',
      );
    }
    return result.value
      .filter((s) => s.assignmentId === assignmentId)
      .sort((a, b) => a.submittedOn.localeCompare(b.submittedOn));
  }

  async findLatestByAssignment(
    assignmentId: EntityId,
  ): Res<Submission | null> {
    const result = await this.findByAssignment(assignmentId);
    // Propagate any error from findByAssignment
    if (!Array.isArray(result)) return result;
    if (result.length === 0) return null;
    // findByAssignment returns ascending order — last element is the newest
    return result[result.length - 1];
  }

  async exists(id: EntityId): Res<boolean> {
    const result = await this.storage.has(this.namespace, id);
    if (!result.ok) {
      return translateStorageError(result.error, 'SubmissionRepository.exists');
    }
    return result.value;
  }
}
