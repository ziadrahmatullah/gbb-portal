import { Component } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "@gbb/ui";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
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
              <CardContent className="text-center space-y-4">
                <div className="text-6xl">⚠️</div>
                <div>
                  <h1 className="text-xl font-bold text-destructive">Something went wrong</h1>
                  <p className="text-sm text-muted-foreground mt-2">
                    An error occurred while rendering this page. Please try refreshing.
                  </p>
                </div>

                {this.state.error && (
                  <div className="bg-muted p-3 rounded-md text-left">
                    <p className="text-xs font-mono text-destructive wrap-break-word">
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
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
