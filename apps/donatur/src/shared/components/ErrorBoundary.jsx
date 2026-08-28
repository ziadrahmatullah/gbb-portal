import { Component } from "react";
import { Button, Card, CardContent } from "@gbb/ui";

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
        <div className="bg-muted/30 grid min-h-svh place-items-center px-4">
          <div className="w-full max-w-md">
            <Card>
              <CardContent className="space-y-4 text-center">
                <div className="text-6xl">⚠️</div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-destructive">Something went wrong</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    An error occurred while rendering this page. Please try refreshing.
                  </p>
                </div>

                {this.state.error && (
                  <div className="rounded-md border bg-muted/50 p-3 text-left">
                    <p className="wrap-break-word font-mono text-xs text-destructive">
                      {this.state.error.toString()}
                    </p>
                  </div>
                )}

                <div className="flex justify-center gap-2">
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
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
