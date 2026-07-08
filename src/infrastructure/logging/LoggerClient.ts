import { generateId } from '@lib';
import type { AuditLogPayload } from './types';

const OBSERVED_SERVER_URL = 'http://localhost:3001/logs';

export async function logEvent(
  eventPayload: Omit<AuditLogPayload, 'id' | 'timestamp' | 'correlationId' | 'sessionId' | 'source'>,
  correlationId?: string,
  sessionId?: string,
  sourceModule?: string
): Promise<void> {
  const corrId = correlationId || generateId();
  const id = generateId();
  const timestamp = new Date().toISOString();

  let sessId = sessionId;
  if (!sessId && typeof sessionStorage !== 'undefined') {
    sessId = sessionStorage.getItem('wl:session_id') || undefined;
    if (!sessId) {
      sessId = generateId();
      sessionStorage.setItem('wl:session_id', sessId);
    }
  }
  if (!sessId) {
    sessId = generateId();
  }

  // Derive module dynamically from eventCode if not explicitly passed
  let derivedModule = sourceModule || 'GeneralService';
  if (!sourceModule) {
    const code = eventPayload.event.eventCode;
    if (code.startsWith('Workspace')) {
      derivedModule = 'WorkspaceService';
    } else if (code.startsWith('Contributor')) {
      derivedModule = 'ContributorService';
    } else if (code.startsWith('Assignment')) {
      derivedModule = 'AssignmentService';
    } else if (code.startsWith('Submission')) {
      derivedModule = 'SubmissionService';
    } else if (code.startsWith('Review') || code.startsWith('Revision')) {
      derivedModule = 'ReviewService';
    }
  }

  const fullPayload: AuditLogPayload = {
    ...eventPayload,
    id,
    correlationId: corrId,
    sessionId: sessId,
    timestamp,
    source: {
      application: 'WorkLedger',
      module: derivedModule,
      version: import.meta.env.PACKAGE_VERSION || '0.1.0',
    },
  };

  try {
    const response = await fetch(OBSERVED_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullPayload),
    });

    if (!response.ok) {
      console.warn(`[Developer Observability Client] Failed to send event log: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.warn('[Developer Observability Client] Failed to connect to Developer Observability Backend. Logging is disabled or server is offline.', error);
  }
}
