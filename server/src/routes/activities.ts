import { Router } from 'express';
import { activityService } from '../services/container.js';
import { sendSuccess } from '../middleware/context.js';
import { ActivityType } from '../types/domain.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || req.workspace?.id || '';
    const filters = {
      type: req.query.type as ActivityType | undefined,
      performedBy: req.query.performedBy as string | undefined,
    };
    const pagination = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    };

    const result = await activityService.getActivitiesForWorkspace(workspaceId, filters, pagination);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

export default router;
