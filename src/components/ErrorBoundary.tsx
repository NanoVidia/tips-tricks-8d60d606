import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Root-level error boundary. Catches uncaught render/effect errors so the app
 * shows a recoverable fallback instead of a blank white screen on production.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface to console; in production this gets captured by any installed
    // crash reporter (Sentry, LogRocket, etc.) automatically.
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleReload = () => {
    try {
      // Best-effort: clear caches so a stuck build doesn't reload into the same error.
      if ("caches" in window) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
      }
    } finally {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center bg-background p-6"
        dir="auto"
      >
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center shadow-lg">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-4">
            The app hit an unexpected error. Reloading usually fixes it.
          </p>
          {this.state.error?.message && (
            <pre className="text-xs text-left bg-muted/50 rounded p-2 mb-4 overflow-auto max-h-32">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
