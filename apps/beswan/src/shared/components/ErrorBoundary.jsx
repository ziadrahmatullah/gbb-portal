import { Component } from "react";
import { AlertTriangle } from "lucide-react";
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
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4 text-center">
              <AlertTriangle className="mx-auto size-10 text-destructive" />
              <div>
                <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  An error occurred while rendering this page. Please try refreshing.
                </p>
              </div>

              {this.state.error && (
                <div className="rounded-md border bg-muted/50 p-3 text-left">
                  <p className="font-mono text-xs wrap-break-word text-destructive">
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
      );
    }

    return this.props.children;
  }
}
