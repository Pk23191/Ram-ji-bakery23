import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-latte/50 p-4">
          <div className="glass-panel max-w-md rounded-2xl p-8 text-center">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="mt-4 font-heading text-2xl text-cocoa">Something went wrong</h1>
            <p className="mt-2 text-sm text-mocha/70">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-3 text-left">
                <summary className="cursor-pointer font-semibold text-cocoa">Error details</summary>
                <pre className="mt-2 overflow-auto rounded bg-cocoa/5 p-2 text-xs">
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-6"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
