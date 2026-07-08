/**
 * Repository Implementations
 *
 * Concrete infrastructure implementations of all domain repository interfaces.
 *
 * Design rules (enforced here and in every repository):
 *   - Constructor injection only: new XRepository(storage) — no singletons, no globals.
 *   - StorageError is translated to DomainError before leaving this layer.
 *     The Application Layer (services, UI) never sees a StorageError.
 *   - All namespace strings come from namespaces.ts — never hardcoded.
 *   - Repositories contain no validation, no business rules, no lifecycle logic.
 *
 * Dependency graph:
 *   WorkspaceRepository(storage)
 *   ContributorRepository(storage)
 *   MilestoneRepository(storage)
 *   AssignmentRepository(storage)
 *   SubmissionRepository(storage)
 *   ReviewRepository(storage)
 *   ActivityRepository(storage)
 *
 * @see docs/09_technical_architecture.md (Repository Pattern)
 */

export { WorkspaceRepository }    from './WorkspaceRepository';
export { ContributorRepository }  from './ContributorRepository';
export { MilestoneRepository }    from './MilestoneRepository';
export { AssignmentRepository }   from './AssignmentRepository';
export { SubmissionRepository }   from './SubmissionRepository';
export { ReviewRepository }       from './ReviewRepository';
export { ActivityRepository }     from './ActivityRepository';

export { STORAGE_NAMESPACES }     from './namespaces';
export type { StorageNamespace }  from './namespaces';

export { translateStorageError }  from './translateStorageError';
