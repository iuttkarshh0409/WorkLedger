import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
import { writePerfLogsBatch } from '../services/logger.js';

export interface RequestContext {
  requestId: string;
  sessionId: string;
  spanStack: string[];
  bufferedEvents: any[];
  currentOperation?: string;
  serviceFinishedAt?: number;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Middleware to generate and attach a unique request ID.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  // If performance logging is disabled, don't execute any profiling or proxy logic
  if (process.env.PERFORMANCE_LOGGING !== 'true') {
    const requestId = req.header('X-Request-ID') || randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
    return;
  }

  const requestId = req.header('X-Request-ID') || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const sessionId = req.header('X-Session-ID') || req.header('x-session-id') || randomUUID();

  // For Outbound/Inbound Network measurements:
  const serverStartTime = Date.now();
  const start = performance.now();

  const context: RequestContext = {
    requestId,
    sessionId,
    spanStack: [requestId], // request ID is the root span ID
    bufferedEvents: [],
  };

  // Intercept writeHead to inject Server-Timestamp and Backend-Duration headers
  const originalWriteHead = res.writeHead;
  res.writeHead = function (statusCode: number, ...args: any[]) {
    const backendDuration = performance.now() - start;
    res.setHeader('X-Server-Timestamp', serverStartTime.toString());
    res.setHeader('X-Backend-Duration', backendDuration.toString());
    return originalWriteHead.apply(res, [statusCode, ...args] as any);
  };

  requestContextStorage.run(context, () => {
    res.on('finish', async () => {
      const durationMs = performance.now() - start;

      // Avoid infinite loop of performance logging when logging endpoint itself is called
      if (req.originalUrl.includes('/logs') || req.originalUrl.includes('/performance')) {
        return;
      }

      // Add Express log
      const expressEvent = {
        id: randomUUID(),
        requestId,
        sessionId,
        spanId: requestId,
        parentId: null,
        timestamp: new Date().toISOString(),
        category: 'Performance',
        stage: 'Express',
        operation: `${req.method} ${req.originalUrl.split('?')[0]}`,
        durationMs,
        metadata: { status: res.statusCode },
      };
      context.bufferedEvents.push(expressEvent);

      // Now calculate and log Response Serialization if a service execution has finished
      if (context.serviceFinishedAt) {
        const serializationDuration = performance.now() - context.serviceFinishedAt;
        context.bufferedEvents.push({
          id: randomUUID(),
          requestId,
          sessionId,
          spanId: randomUUID(),
          parentId: requestId,
          timestamp: new Date().toISOString(),
          category: 'Performance',
          stage: 'Response Serialization',
          operation: 'Response Serialization',
          durationMs: serializationDuration,
          metadata: {},
        });
      }

      // Sample High-Volume Events: Log every request >300 ms, and 10% of requests below 300 ms.
      const isSlow = durationMs > 300;
      const isSampled = isSlow || Math.random() < 0.1;

      if (isSampled) {
        await writePerfLogsBatch(context.bufferedEvents);
      }
    });

    next();
  });
}

/**
 * Development Stub Authentication Middleware.
 * Reads headers (x-user-id, x-user-role, x-workspace-id, etc.) or uses stable defaults.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const userId = req.header('x-user-id') || '00000000-0000-0000-0000-000000000001';
  const role = req.header('x-user-role') || 'Owner';
  const email = req.header('x-user-email') || 'demo@workledger.dev';
  const name = req.header('x-user-name') || 'Demo Owner';
  const workspaceId = req.header('x-workspace-id') || '00000000-0000-0000-0000-000000000002';

  req.user = {
    id: userId,
    role,
    email,
    name,
  };

  req.workspace = {
    id: workspaceId,
  };

  next();
}

/**
 * Standard Success Response Helper.
 */
export function sendSuccess(res: Response, data: any, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Standard Error Response Helper.
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  details: Record<string, any> = {},
  statusCode = 500
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

/**
 * Central Express Error Handling Middleware.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[Error] Request ${req.requestId || 'N/A'} failed:`, err);

  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred.';
  const details = err.details || {};
  const status = err.status || 500;

  sendError(res, code, message, details, status);
}
