/**
 * Application Composition Root
 *
 * The single location where every concrete implementation is instantiated.
 * No other file in the codebase should call `new XxxRepository()` or
 * `new XxxService()` — those are exclusively the responsibility of this module.
 *
 * Construction order:
 *   1. LocalStorageProvider          (no dependencies)
 *   2. WorkspaceRepository           (storage)
 *   3. ContributorRepository         (storage)
 *   4. MilestoneRepository           (storage)
 *   5. AssignmentRepository          (storage)
 *   6. SubmissionRepository          (storage)
 *   7. ReviewRepository              (storage)
 *   8. ActivityRepository            (storage)
 *   9. ActivityService               (activityRepository)
 *  10. WorkspaceService              (workspaceRepository, activityService)
 *  11. ContributorService            (contributorRepository, activityService)
 *  12. MilestoneService              (milestoneRepository, activityService)
 *  13. AssignmentService             (assignmentRepository, activityService)
 *  14. SubmissionService             (submissionRepository, assignmentRepository, activityService)
 *  15. ReviewService                 (reviewRepository, assignmentRepository, activityService)
 *
 * Failure policy:
 *   If LocalStorageProvider cannot be constructed (storage unavailable),
 *   this function throws immediately. The application does not mount.
 *   There is no silent recovery — a clear startup error is preferable to
 *   an app that silently cannot persist anything.
 *
 * @see docs/09_technical_architecture.md (Composition Root)
 * @see docs/03.5_system_architecture.md (Infrastructure is independently replaceable)
 * @see docs/adr/ADR-001-repository-result-strategy.md
 */

// ─── Storage ──────────────────────────────────────────────────────────────────
import { LocalStorageProvider } from '@infrastructure/storage/LocalStorageProvider';
import type { IStorageProvider } from '@infrastructure/storage/IStorageProvider';

// ─── Repositories ─────────────────────────────────────────────────────────────
import { WorkspaceRepository }   from '@infrastructure/repositories/WorkspaceRepository';
import { ContributorRepository } from '@infrastructure/repositories/ContributorRepository';
import { MilestoneRepository }   from '@infrastructure/repositories/MilestoneRepository';
import { AssignmentRepository }  from '@infrastructure/repositories/AssignmentRepository';
import { SubmissionRepository }  from '@infrastructure/repositories/SubmissionRepository';
import { ReviewRepository }      from '@infrastructure/repositories/ReviewRepository';
import { ActivityRepository }    from '@infrastructure/repositories/ActivityRepository';

// ─── Services ─────────────────────────────────────────────────────────────────
import { ActivityService }     from '@services/activity/ActivityService';
import { WorkspaceService }    from '@services/workspace/WorkspaceService';
import { ContributorService }  from '@services/contributor/ContributorService';
import { MilestoneService }    from '@services/milestone/MilestoneService';
import { AssignmentService }   from '@services/assignment/AssignmentService';
import { SubmissionService }   from '@services/submission/SubmissionService';
import { ReviewService }       from '@services/review/ReviewService';

// ─── Service interfaces (for the public type) ─────────────────────────────────
import type { IActivityService }    from '@services/activity/IActivityService';
import type { IWorkspaceService }   from '@services/workspace/IWorkspaceService';
import type { IContributorService } from '@services/contributor/IContributorService';
import type { IMilestoneService }   from '@services/milestone/IMilestoneService';
import type { IAssignmentService }  from '@services/assignment/IAssignmentService';
import type { ISubmissionService }  from '@services/submission/ISubmissionService';
import type { IReviewService }      from '@services/review/IReviewService';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * ApplicationStorage
 *
 * The storage layer of the composition.
 * Typed to the interface so future callers are not coupled to
 * LocalStorageProvider specifically.
 */
export interface ApplicationStorage {
  readonly provider: IStorageProvider;
}

/**
 * ApplicationRepositories
 *
 * The persistence layer of the composition.
 * All repository fields are typed to their domain interfaces.
 */
export interface ApplicationRepositories {
  readonly workspaces:    WorkspaceRepository;
  readonly contributors:  ContributorRepository;
  readonly milestones:    MilestoneRepository;
  readonly assignments:   AssignmentRepository;
  readonly submissions:   SubmissionRepository;
  readonly reviews:       ReviewRepository;
  readonly activities:    ActivityRepository;
}

/**
 * ApplicationServices
 *
 * The application layer of the composition.
 * All service fields are typed to their interface contracts —
 * callers depend on the interface, not the implementation.
 */
export interface ApplicationServices {
  readonly activity:     IActivityService;
  readonly workspace:    IWorkspaceService;
  readonly contributor:  IContributorService;
  readonly milestone:    IMilestoneService;
  readonly assignment:   IAssignmentService;
  readonly submission:   ISubmissionService;
  readonly review:       IReviewService;
}

/**
 * ApplicationComposition
 *
 * The complete, frozen dependency graph for the WorkLedger application.
 *
 * Export this type to allow React context and hooks to reference the
 * composition shape without redefining it.
 */
export interface ApplicationComposition {
  readonly storage:      ApplicationStorage;
  readonly repositories: ApplicationRepositories;
  readonly services:     ApplicationServices;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * createApplicationComposition
 *
 * Constructs the full dependency graph in a single pass.
 * Call this once during application startup, before mounting React.
 *
 * @throws {StorageUnavailableError} when localStorage is not accessible.
 *   The application must not mount if this throws — there is no recovery path.
 *
 * @example
 *   // main.tsx
 *   const composition = createApplicationComposition();
 *   createRoot(rootElement).render(<App composition={composition} />);
 */
export function createApplicationComposition(): ApplicationComposition {
  // ── Layer 1: Storage ───────────────────────────────────────────────────────
  // LocalStorageProvider constructor throws StorageUnavailableError if
  // localStorage is inaccessible. Let it propagate — startup fails fast.
  const provider = new LocalStorageProvider();

  const storage: ApplicationStorage = Object.freeze({ provider });

  // ── Layer 2: Repositories ─────────────────────────────────────────────────
  // Each repository receives only the storage provider.
  // Order within this group is arbitrary — no inter-repository dependencies.
  const workspaces   = new WorkspaceRepository(provider);
  const contributors = new ContributorRepository(provider);
  const milestones   = new MilestoneRepository(provider);
  const assignments  = new AssignmentRepository(provider);
  const submissions  = new SubmissionRepository(provider);
  const reviews      = new ReviewRepository(provider);
  const activities   = new ActivityRepository(provider);

  const repositories: ApplicationRepositories = Object.freeze({
    workspaces,
    contributors,
    milestones,
    assignments,
    submissions,
    reviews,
    activities,
  });

  // ── Layer 3: Services ─────────────────────────────────────────────────────
  // ActivityService has no service dependencies — construct it first.
  // All other services depend on activityService for event recording.
  const activityService    = new ActivityService(activities);
  const workspaceService   = new WorkspaceService(workspaces, activityService);
  const contributorService = new ContributorService(contributors, activityService);
  const milestoneService   = new MilestoneService(milestones, activityService, contributors);
  const assignmentService  = new AssignmentService(assignments, activityService, contributors);
  const submissionService  = new SubmissionService(submissions, assignments, activityService, contributors);
  const reviewService      = new ReviewService(reviews, assignments, activityService, contributors);

  const services: ApplicationServices = Object.freeze({
    activity:    activityService,
    workspace:   workspaceService,
    contributor: contributorService,
    milestone:   milestoneService,
    assignment:  assignmentService,
    submission:  submissionService,
    review:      reviewService,
  });

  // ── Freeze and return ─────────────────────────────────────────────────────
  return Object.freeze({ storage, repositories, services });
}
