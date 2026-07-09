import { Router } from 'express';
import { submissionService } from '../services/container.js';
import { sendSuccess } from '../middleware/context.js';

const router = Router();

router.get('/assignment/:assignmentId', async (req, res, next) => {
  try {
    const list = await submissionService.getSubmissionsByAssignment(req.params.assignmentId);
    sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const s = await submissionService.getSubmissionById(req.params.id);
    sendSuccess(res, s);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const s = await submissionService.createSubmission(
      {
        assignmentId: req.body.assignmentId,
        description: req.body.description,
        githubRepository: req.body.githubRepository,
        pullRequest: req.body.pullRequest,
        demoLink: req.body.demoLink,
        notes: req.body.notes,
      },
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, s, 201);
  } catch (err) {
    next(err);
  }
});

export default router;
