import { useEffect, useRef } from 'react';
import { generateId } from '@lib/id';


const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const LOGS_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api/v1', '/logs')
  : (isProduction
      ? '/logs'
      : 'http://localhost:3001/logs');

export const perfState = {
  currentRequestId: null as string | null,
  currentPageName: 'General',
  firstRequestStarted: false,
  mountTime: 0,
  lastRequestResolvedTime: 0,
};

export async function logPerformanceEvent(event: {
  requestId: string;
  category: 'Performance';
  stage: string;
  operation: string;
  durationMs: number;
  metadata?: Record<string, any>;
}): Promise<void> {
  const sessionId = typeof sessionStorage !== 'undefined'
    ? (sessionStorage.getItem('wl:session_id') || 'system')
    : 'system';

  const fullEvent = {
    id: Math.random().toString(36).substring(2, 15),
    requestId: event.requestId,
    sessionId,
    timestamp: new Date().toISOString(),
    category: 'Performance',
    stage: event.stage,
    operation: event.operation,
    durationMs: Math.max(0.1, parseFloat(event.durationMs.toFixed(2))),
    metadata: event.metadata || {},
  };

  try {
    const response = await fetch(LOGS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullEvent),
    });

    if (!response.ok) {
      console.warn(`[Performance Logger] Failed to send performance event: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn('[Performance Logger] Failed to connect to Developer Observability Backend.', error);
  }
}

export function usePerformanceTracker(pageName: string, isLoading: boolean) {
  const isInitialMount = useRef(true);
  const reqId = useRef<string | null>(null);
  const hasFinished = useRef(false);

  // If on mount, we initialize
  if (isInitialMount.current) {
    isInitialMount.current = false;
    const newId = generateId();
    reqId.current = newId;
    perfState.currentRequestId = newId;
    perfState.currentPageName = pageName;
    perfState.firstRequestStarted = false;
    perfState.mountTime = performance.now();
    perfState.lastRequestResolvedTime = performance.now();
  }

  useEffect(() => {
    // When loading transitions from true -> false
    if (!isLoading && reqId.current && !hasFinished.current) {
      hasFinished.current = true;
      const end = performance.now();
      const renderDuration = end - perfState.lastRequestResolvedTime;
      const requestId = reqId.current;

      // Log Render stage
      logPerformanceEvent({
        requestId,
        category: 'Performance',
        stage: 'Render',
        operation: `${pageName} Render`,
        durationMs: renderDuration,
      });

      // Clear the current request ID after a short delay so any trailing requests finish
      setTimeout(() => {
        if (perfState.currentRequestId === requestId) {
          perfState.currentRequestId = null;
        }
      }, 1000);
    }
  }, [isLoading, pageName]);
}
