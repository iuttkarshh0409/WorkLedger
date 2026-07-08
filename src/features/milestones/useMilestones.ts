/**
 * useMilestones
 *
 * Manages milestone state for the Milestones page.
 *
 * Responsibilities:
 * - Bootstrap demo workspace
 * - Load all milestones and assignments for the workspace
 * - Create, complete, and archive milestones
 * - Derive progress per milestone from assignment counts
 * - Expose loading, error, and submitting states
 *
 * Progress derivation:
 *   completed = assignments where status === Completed AND milestoneId === id
 *   total     = assignments where milestoneId === id (excluding Archived)
 *   Progress is never stored — always computed here.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  Milestone,
  Assignment,
  CreateMilestoneInput,
  AnyDomainError,
  EntityId,
} from '@domain';
import { AssignmentStatus } from '@domain';
import type { IMilestoneService }  from '@services/milestone/IMilestoneService';
import type { IAssignmentService } from '@services/assignment/IAssignmentService';
import type { IWorkspaceService }  from '@services/workspace/IWorkspaceService';
import { isDomainError } from '@lib/errors';
import { getOrCreateDemoWorkspace, DEMO_OWNER_ID } from '@lib/bootstrap';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MilestoneProgress {
  milestoneId: EntityId;
  total:       number;
  completed:   number;
}

function formatError(err: AnyDomainError): string {
  switch (err.kind) {
    case 'ValidationError': return err.errors.join(' ');
    case 'NotFoundError':   return `${err.entity} not found.`;
    case 'ConflictError':   return err.message;
    case 'PermissionError': return `Permission denied: ${err.reason}`;
    case 'DomainError':     return err.message;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseMilestonesState {
  milestones:  Milestone[];
  progress:    MilestoneProgress[];
  workspaceId: string | null;
  loading:     boolean;
  error:       string | null;
  submitting:  boolean;
  submitError: string | null;
}

interface UseMilestonesActions {
  createMilestone:  (input: Omit<CreateMilestoneInput, 'workspaceId'>) => Promise<boolean>;
  completeMilestone:(id: EntityId) => Promise<boolean>;
  archiveMilestone: (id: EntityId) => Promise<boolean>;
  clearSubmitError: () => void;
}

export type UseMilestonesResult = UseMilestonesState & UseMilestonesActions;

export function useMilestones(
  milestoneService:  IMilestoneService,
  assignmentService: IAssignmentService,
  workspaceService:  IWorkspaceService,
): UseMilestonesResult {
  const [milestones,  setMilestones]  = useState<Milestone[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Load ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const wsId = await getOrCreateDemoWorkspace(workspaceService);
        if (cancelled) return;
        setWorkspaceId(wsId);

        const [mResult, aResult] = await Promise.all([
          milestoneService.getMilestonesByWorkspace(wsId),
          assignmentService.getAssignmentsByWorkspace(wsId),
        ]);

        if (cancelled) return;
        if (isDomainError(mResult)) { setError(formatError(mResult)); setLoading(false); return; }
        if (isDomainError(aResult)) { setError(formatError(aResult)); setLoading(false); return; }

        setMilestones(mResult);
        setAssignments(aResult);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load milestones.');
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [milestoneService, assignmentService, workspaceService]);

  // ── Derived progress ──────────────────────────────────────────────────────

  const progress = useMemo<MilestoneProgress[]>(() =>
    milestones.map((m) => {
      const linked = assignments.filter(
        (a) => a.milestoneId === m.id && a.status !== AssignmentStatus.Archived,
      );
      return {
        milestoneId: m.id,
        total:       linked.length,
        completed:   linked.filter((a) => a.status === AssignmentStatus.Completed).length,
      };
    }),
    [milestones, assignments],
  );

  // ── Create ────────────────────────────────────────────────────────────────

  const createMilestone = useCallback(
    async (input: Omit<CreateMilestoneInput, 'workspaceId'>): Promise<boolean> => {
      if (!workspaceId) return false;
      setSubmitting(true);
      setSubmitError(null);

      const result = await milestoneService.createMilestone(
        { ...input, workspaceId },
        DEMO_OWNER_ID,
      );

      setSubmitting(false);
      if (isDomainError(result)) { setSubmitError(formatError(result)); return false; }
      setMilestones((prev) => [...prev, result]);
      return true;
    },
    [milestoneService, workspaceId],
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  const completeMilestone = useCallback(
    async (id: EntityId): Promise<boolean> => {
      const result = await milestoneService.completeMilestone(id, DEMO_OWNER_ID);
      if (isDomainError(result)) { setSubmitError(formatError(result)); return false; }
      setMilestones((prev) => prev.map((m) => m.id === id ? result : m));
      return true;
    },
    [milestoneService],
  );

  const archiveMilestone = useCallback(
    async (id: EntityId): Promise<boolean> => {
      const result = await milestoneService.archiveMilestone(id, DEMO_OWNER_ID);
      if (isDomainError(result)) { setSubmitError(formatError(result)); return false; }
      setMilestones((prev) => prev.map((m) => m.id === id ? result : m));
      return true;
    },
    [milestoneService],
  );

  const clearSubmitError = useCallback(() => setSubmitError(null), []);

  return {
    milestones, progress, workspaceId,
    loading, error, submitting, submitError,
    createMilestone, completeMilestone, archiveMilestone, clearSubmitError,
  };
}
