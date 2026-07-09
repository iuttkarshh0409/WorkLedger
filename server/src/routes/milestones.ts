import { Router } from 'express';
import { milestoneService } from '../services/container.js';
import { sendSuccess } from '../middleware/context.js';
import { MilestoneStatus } from '../types/domain.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || req.workspace?.id || '';
    const status = req.query.status as MilestoneStatus | undefined;
    const list = await milestoneService.getMilestonesByWorkspace(workspaceId, status);
    sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const m = await milestoneService.getMilestoneById(req.params.id);
    sendSuccess(res, m);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const workspaceId = req.body.workspaceId || req.workspace?.id || '';
    const m = await milestoneService.createMilestone(
      {
        workspaceId,
        title: req.body.title,
        description: req.body.description,
        startDate: req.body.startDate,
        deadline: req.body.deadline,
        status: req.body.status,
      },
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, m, 201);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const m = await milestoneService.updateMilestone(
      req.params.id,
      req.body,
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, m);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/archive', async (req, res, next) => {
  try {
    const m = await milestoneService.archiveMilestone(
      req.params.id,
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, m);
  } catch (err) {
    next(err);
  }
});

export default router;
