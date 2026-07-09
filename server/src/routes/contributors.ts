import { Router } from 'express';
import { contributorService } from '../services/container.js';
import { sendSuccess } from '../middleware/context.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const workspaceId = (req.query.workspaceId as string) || req.workspace?.id || '';
    const list = await contributorService.getContributorsByWorkspace(workspaceId);
    sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const c = await contributorService.getContributorById(req.params.id);
    sendSuccess(res, c);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const workspaceId = req.body.workspaceId || req.workspace?.id || '';
    const c = await contributorService.createContributor(
      {
        id: req.body.id,
        workspaceId,
        name: req.body.name,
        email: req.body.email,
        avatar: req.body.avatar,
        role: req.body.role,
      },
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, c, 201);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const c = await contributorService.updateContributor(
      req.params.id,
      req.body,
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, c);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/archive', async (req, res, next) => {
  try {
    const c = await contributorService.archiveContributor(
      req.params.id,
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, c);
  } catch (err) {
    next(err);
  }
});

export default router;
