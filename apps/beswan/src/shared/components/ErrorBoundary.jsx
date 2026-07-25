import { Component } from "react";
import { Button } from "@gbb/ui";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
          <div className="w-full max-w-md">
            <div className="rounded-xl border bg-card p-6 shadow-sm text-center space-y-4">
              <div className="text-6xl">⚠️</div>
              <div>
                <h1 className="text-xl font-bold text-destructive">Something went wrong</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  An error occurred while rendering this page. Please try refreshing.
                </p>
              </div>

              {this.state.error && (
                <div className="bg-muted p-3 rounded-lg text-left">
                  <p className="text-xs font-mono text-destructive break-words">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
                <Button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
