// No-op logging stub to replace removed telemetry/debugging loggers
export async function logEvent(_payload: any): Promise<void> {
  // no-op
}

export function usePerformanceTracker(_pageName: string, _loading: boolean) {
  // no-op
}

export const perfState = {
  currentRequestId: null as string | null,
};

export function logPerformanceEvent(_event: any) {
  // no-op
}
