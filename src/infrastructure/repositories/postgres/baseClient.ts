import { AnyDomainError } from '@domain';
import { validationError, notFound, conflict, permissionDenied, domainError } from '@lib/errors';
import { perfState, logPerformanceEvent } from '@infrastructure/logging';
import { generateId } from '@lib/id';

const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
export const API_BASE_URL = isProduction
  ? 'https://workledger-backend.dubeutkarsh7.workers.dev/api/v1'
  : 'http://localhost:3001/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details: Record<string, any>;
  };
}

export async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | AnyDomainError> {
  const requestId = perfState.currentRequestId || generateId();

  if (perfState.currentRequestId && !perfState.firstRequestStarted) {
    perfState.firstRequestStarted = true;
    const frontendDuration = performance.now() - perfState.mountTime;
    logPerformanceEvent({
      requestId,
      category: 'Performance',
      stage: 'Frontend',
      operation: `${perfState.currentPageName} Load`,
      durationMs: frontendDuration,
    });
  }

  try {
    const url = `${API_BASE_URL}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      ...((options.headers as Record<string, string>) || {}),
    };

    // Retrieve and inject mock session context headers if present
    const currentSession = localStorage.getItem('wl:session');
    if (currentSession) {
      try {
        const parsed = JSON.parse(currentSession);
        const userId = parsed.contributorId || parsed.id;
        if (userId) headers['x-user-id'] = userId;
        if (parsed.role) headers['x-user-role'] = parsed.role;
        if (parsed.email) headers['x-user-email'] = parsed.email;
        if (parsed.name) headers['x-user-name'] = parsed.name;
        if (parsed.workspaceId) headers['x-workspace-id'] = parsed.workspaceId;
      } catch (e) {
        // Ignore session parsing failures
      }
    }

    const clientStartTime = Date.now();
    const tFetchStart = performance.now();
    
    // Inject client-side request timestamp
    headers['X-Client-Timestamp'] = clientStartTime.toString();

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } finally {
      const tFetchEnd = performance.now();
      const totalNetworkRoundtrip = tFetchEnd - tFetchStart;

      let serverStartTime = 0;
      let backendDuration = 0;
      if (response) {
        const sTime = response.headers.get('X-Server-Timestamp');
        const bDuration = response.headers.get('X-Backend-Duration');
        if (sTime) serverStartTime = parseFloat(sTime);
        if (bDuration) backendDuration = parseFloat(bDuration);
      }

      const operation = `${options.method || 'GET'} ${path.split('?')[0]}`;

      if (serverStartTime && backendDuration) {
        const outbound = Math.max(0.1, serverStartTime - clientStartTime);
        const backend = backendDuration;
        const returnDur = Math.max(0.1, totalNetworkRoundtrip - outbound - backend);

        logPerformanceEvent({
          requestId,
          category: 'Performance',
          stage: 'Network Outbound',
          operation: `${operation} (Outbound)`,
          durationMs: outbound,
        });

        logPerformanceEvent({
          requestId,
          category: 'Performance',
          stage: 'Backend',
          operation: `${operation} (Backend)`,
          durationMs: backend,
        });

        logPerformanceEvent({
          requestId,
          category: 'Performance',
          stage: 'Network Return',
          operation: `${operation} (Return)`,
          durationMs: returnDur,
        });
      } else {
        logPerformanceEvent({
          requestId,
          category: 'Performance',
          stage: 'Network',
          operation,
          durationMs: totalNetworkRoundtrip,
        });
      }

      perfState.lastRequestResolvedTime = tFetchEnd;
    }

    const body: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      error: { code: 'JSON_PARSE_ERROR', message: 'Failed to parse JSON response', details: {} },
    }));

    if (body.success && body.data !== undefined) {
      return body.data;
    }

    const err = body.error || { code: 'UNKNOWN_ERROR', message: 'An unknown server error occurred', details: {} };

    switch (err.code) {
      case 'VALIDATION_ERROR':
        return validationError(path, err.details?.errors || [err.message]);
      case 'NOT_FOUND':
        return notFound(err.details?.entityType || 'Resource', err.details?.entityId || '');
      case 'RESOURCE_CONFLICT':
      case 'DUPLICATE_REVIEW':
      case 'EMAIL_CONFLICT':
        return conflict(err.message);
      case 'PERMISSION_DENIED':
        return permissionDenied(path, err.message);
      default:
        return domainError(err.message || 'An unknown server error occurred');
    }
  } catch (error: any) {
    return domainError(error.message || 'Network request failed');
  }
}

