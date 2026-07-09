import { Router } from 'express';
import { workspaceService } from '../services/container.js';
import { sendSuccess, sendError } from '../middleware/context.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (ownerId) {
      const list = await workspaceService.getWorkspacesByOwner(ownerId);
      return sendSuccess(res, list);
    }
    const list = await workspaceService.getAllWorkspaces();
    sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const ws = await workspaceService.getWorkspaceById(req.params.id);
    sendSuccess(res, ws);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const ws = await workspaceService.createWorkspace(
      {
        name: req.body.name,
        description: req.body.description,
        ownerId: req.body.ownerId || req.user?.id || '',
      },
      req.requestId
    );
    sendSuccess(res, ws, 201);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const ws = await workspaceService.updateWorkspace(
      req.params.id,
      req.body,
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, ws);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/archive', async (req, res, next) => {
  try {
    const ws = await workspaceService.archiveWorkspace(
      req.params.id,
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, ws);
  } catch (err) {
    next(err);
  }
});

export default router;
