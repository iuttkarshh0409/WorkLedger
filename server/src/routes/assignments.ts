import { Router } from 'express';
import { assignmentService } from '../services/container.js';
import { sendSuccess } from '../middleware/context.js';
import { AssignmentStatus, AssignmentPriority } from '../types/domain.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || req.workspace?.id || '';
    const filters = {
      milestoneId: req.query.milestoneId as string | undefined,
      contributorId: req.query.contributorId as string | undefined,
      reviewerId: req.query.reviewerId as string | undefined,
      status: req.query.status as AssignmentStatus | undefined,
      priority: req.query.priority as AssignmentPriority | undefined,
    };
    const pagination = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100,
    };

    const result = await assignmentService.getAssignmentsByWorkspace(workspaceId, filters, pagination);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const a = await assignmentService.getAssignmentById(req.params.id);
    sendSuccess(res, a);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const workspaceId = req.body.workspaceId || req.workspace?.id || '';
    const a = await assignmentService.createAssignment(
      {
        workspaceId,
        milestoneId: req.body.milestoneId,
        contributorId: req.body.contributorId,
        reviewerId: req.body.reviewerId,
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority,
        tags: req.body.tags,
        assignedOn: req.body.assignedOn,
        deadline: req.body.deadline,
      },
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, a, 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const a = await assignmentService.updateAssignment(
      req.params.id,
      req.body,
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, a);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/archive', async (req, res, next) => {
  try {
    const a = await assignmentService.archiveAssignment(
      req.params.id,
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, a);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const performedBy = req.user?.id || 'system';
    const workspaceId = req.workspace?.id || '';
    const userRole = req.user?.role || '';

    await assignmentService.deleteAssignment(
      req.params.id,
      performedBy,
      workspaceId,
      userRole
    );
    sendSuccess(res, { message: 'Assignment deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
