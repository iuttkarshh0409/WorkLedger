import { Router } from 'express';
import { reviewService, reviewQuery } from '../services/container.js';
import { sendSuccess } from '../middleware/context.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const reviewerId = req.query.reviewerId as string;
    if (reviewerId) {
      const list = await reviewQuery.findByReviewer(reviewerId);
      return sendSuccess(res, list);
    }
    sendSuccess(res, []);
  } catch (err) {
    next(err);
  }
});


router.get('/submission/:submissionId', async (req, res, next) => {
  try {
    const r = await reviewService.getReviewBySubmission(req.params.submissionId);
    sendSuccess(res, r);
  } catch (err) {
    next(err);
  }
});

router.get('/assignment/:assignmentId', async (req, res, next) => {
  try {
    const list = await reviewService.getReviewsByAssignment(req.params.assignmentId);
    sendSuccess(res, list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const r = await reviewService.getReviewById(req.params.id);
    sendSuccess(res, r);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const r = await reviewService.publishReview(
      {
        assignmentId: req.body.assignmentId,
        submissionId: req.body.submissionId,
        reviewedBy: req.body.reviewedBy || req.user?.id || '',
        reviewedOn: req.body.reviewedOn || new Date().toISOString(),
        scores: req.body.scores,
        strengths: req.body.strengths,
        improvements: req.body.improvements,
        feedback: req.body.feedback,
        isHistorical: req.body.isHistorical,
        enteredOn: req.body.enteredOn,
      },
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, r, 201);
  } catch (err) {
    next(err);
  }
});

router.post('/revision', async (req, res, next) => {
  try {
    const r = await reviewService.requestRevision(
      {
        assignmentId: req.body.assignmentId,
        submissionId: req.body.submissionId,
        feedback: req.body.feedback,
        reviewedOn: req.body.reviewedOn,
        isHistorical: req.body.isHistorical,
        enteredOn: req.body.enteredOn,
      },
      req.user?.id || 'system',
      req.requestId
    );
    sendSuccess(res, r, 201);
  } catch (err) {
    next(err);
  }
});

export default router;
