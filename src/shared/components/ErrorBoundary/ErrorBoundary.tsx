/**
 * ErrorBoundary
 *
 * React error boundary for runtime errors.
 *
 * Catches unexpected errors in the component tree below it and renders
 * a fallback UI instead of crashing the whole application.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 * This complements the startup protection in main.tsx (which guards
 * against storage unavailability before React mounts).
 * ErrorBoundary guards against runtime errors after React has mounted.
 *
 * @see src/main.tsx (startup failure handling)
 * @see docs/09_technical_architecture.md (Application Layer)
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children:  ReactNode;
  /** Optional custom fallback. Defaults to the built-in error screen. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log to console for debugging. Future: send to an error tracking service.
    console.error('[WorkLedger] Runtime error caught by ErrorBoundary:', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error !== null) {
      if (fallback) {
        return fallback(error, this.handleReset);
      }

      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-surface-secondary"
        >
          <div className="max-w-md">
            {/* Icon */}
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-danger"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>

            <h1 className="text-lg font-semibold text-text-primary mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-text-secondary mb-6">
              An unexpected error occurred. Your data is safe — this is a display error only.
            </p>

            {/* Error detail — collapsed by default */}
            <details className="mb-6 text-left">
              <summary className="text-xs text-text-muted cursor-pointer hover:text-text-secondary">
                Show error details
              </summary>
              <pre className="mt-2 p-3 rounded-md bg-surface-muted text-xs text-text-secondary overflow-auto max-h-32">
                {error.message}
              </pre>
            </details>

            <button
              type="button"
              onClick={this.handleReset}
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-md
                text-sm font-medium text-text-inverse bg-accent
                hover:bg-accent-hover transition-colors duration-150
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
              "
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}
