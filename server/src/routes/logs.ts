import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { readLogs, writeLog, clearLogs, writePerfLog } from '../services/logger.js';
import { AuditLog } from '../types/index.js';

const router = Router();

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''} ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
}

// POST /logs - write a new log
router.post('/', async (req: Request, res: Response) => {
  try {
    if (req.body && req.body.category === 'Performance') {
      const perfEvent = req.body;
      const durationMs = perfEvent.durationMs || 0;
      const isSlow = durationMs > 300;
      const isSampled = isSlow || Math.random() < 0.1;
      if (isSampled) {
        await writePerfLog(perfEvent);
      }
      res.status(201).json({ status: 'created', log: perfEvent });
      return;
    }

    const logPayload = req.body as AuditLog;


    if (!logPayload.workspace || !logPayload.actor || !logPayload.event || !logPayload.entity) {
      res.status(400).json({ error: 'Invalid log payload: missing required fields' });
      return;
    }

    const logs = await readLogs();
    const sequence = logs.length + 1;
    const currentTimestamp = logPayload.timestamp || new Date().toISOString();

    const log: AuditLog = {
      id: logPayload.id || randomUUID(),
      correlationId: logPayload.correlationId || (logPayload as any).requestId || randomUUID(),
      sessionId: logPayload.sessionId || randomUUID(),
      sequence,
      message: logPayload.message || 'Event occurred',
      timestamp: currentTimestamp,
      source: logPayload.source || {
        application: 'WorkLedger',
        module: 'GeneralService',
        version: '0.1.0'
      },
      workspace: logPayload.workspace,
      actor: logPayload.actor,
      event: logPayload.event,
      entity: logPayload.entity,
      state: logPayload.state ? { ...logPayload.state } : undefined,
      details: logPayload.details ? { ...logPayload.details, metadata: { ...logPayload.details.metadata } } : { metadata: {} }
    };

    // Calculate transition text if statuses are present
    if (log.state?.before?.status && log.state?.after?.status) {
      log.state.transition = `${log.state.before.status} → ${log.state.after.status}`;
    }

    // Calculate duration between transitions
    if (log.entity.entityType === 'Assignment') {
      const currentMs = new Date(currentTimestamp).getTime();

      // Find creation log for elapsed since creation
      const creationLog = logs.find(
        (l) => l.entity.entityId === log.entity.entityId && l.event.eventCode === 'AssignmentCreated'
      );
      if (creationLog) {
        const creationMs = new Date(creationLog.timestamp).getTime();
        const elapsed = currentMs - creationMs;
        if (elapsed >= 0) {
          log.details.elapsedSinceCreation = formatDuration(elapsed);
        }
      }

      // Find previous log for time in previous state
      const reversedLogs = [...logs].reverse();
      const previousLog = reversedLogs.find((l) => l.entity.entityId === log.entity.entityId);
      if (previousLog) {
        const prevMs = new Date(previousLog.timestamp).getTime();
        const diff = currentMs - prevMs;
        if (diff >= 0) {
          log.details.timeInPreviousState = formatDuration(diff);
        }
      }
    }

    await writeLog(log);
    res.status(201).json({ status: 'created', log });
  } catch (error) {
    console.error('Error handling log write:', error);
    res.status(500).json({ error: 'Failed to write log' });
  }
});

// GET /logs/latest - get latest logs (limit default 20)
router.get('/latest', async (req: Request, res: Response) => {
  try {
    const logs = await readLogs();
    const limitQuery = req.query.limit;
    const limit = limitQuery ? parseInt(limitQuery as string, 10) : 20;

    if (isNaN(limit) || limit <= 0) {
      res.status(400).json({ error: 'Limit query parameter must be a positive integer' });
      return;
    }

    // Since logs are appended, the latest are at the end.
    // Return them latest first.
    const latestLogs = logs.slice(-limit).reverse();
    res.json(latestLogs);
  } catch (error) {
    console.error('Error handling logs retrieval:', error);
    res.status(500).json({ error: 'Failed to retrieve latest logs' });
  }
});

// GET /logs - retrieve all logs
router.get('/', async (_req: Request, res: Response) => {
  try {
    const logs = await readLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error handling get all logs:', error);
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// DELETE /logs - clear all logs
router.delete('/', async (_req: Request, res: Response) => {
  try {
    await clearLogs();
    res.json({ status: 'cleared' });
  } catch (error) {
    console.error('Error handling logs clear:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

export default router;
