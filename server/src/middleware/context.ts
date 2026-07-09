import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface RequestContext {
  requestId: string;
}

/**
 * Middleware to generate and attach a unique request ID.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  const rawRequestId = req.header('X-Request-ID');
  const requestId = (rawRequestId && isUuid(rawRequestId)) ? rawRequestId : randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
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

  const origin = req.headers.origin || req.headers.Origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID,X-Session-ID,X-Client-Timestamp,x-user-id,x-user-role,x-user-email,x-user-name,x-workspace-id');

  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred.';
  const details = {
    ...(err.details || {}),
    dbCode: err.code,
    dbMessage: err.message,
    dbDetail: err.detail,
    dbTable: err.table,
    dbConstraint: err.constraint,
    stack: err.stack,
  };
  const status = err.status || 500;

  sendError(res, code, message, details, status);
}
