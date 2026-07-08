export interface AuditLog {
  id: string;
  correlationId: string;
  sessionId: string;
  sequence: number;
  message: string;
  timestamp: string;
  source: {
    application: string;
    module: string;
    version: string;
  };
  workspace: {
    workspaceId: string;
    workspaceName: string;
  };
  actor: {
    contributorId: string;
    contributorName: string;
    contributorRole: string;
  };
  event: {
    eventCode: string;
    eventLabel: string;
    performedAction?: string;
  };
  entity: {
    entityType: string;
    entityId: string;
    entityName: string;
  };
  state?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    transition?: string;
  };
  details: {
    metadata: Record<string, unknown>;
    timeInPreviousState?: string;
    elapsedSinceCreation?: string;
  };
}
