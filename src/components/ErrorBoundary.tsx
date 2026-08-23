import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RedlineLogo } from './RedlineLogo';
import { AlertTriangle, RefreshCw, Home, MessageSquare } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Redline Garage Error Boundary Caught]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-lg w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-md text-center space-y-6">
            
            {/* Header Brand Logo */}
            <div className="flex justify-center">
              <RedlineLogo variant="full" theme="dark" size="lg" />
            </div>

            {/* Error Graphic / Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto shadow-lg shadow-red-600/10">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            {/* Error Details */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight font-sans text-white">
                Pit Stop Required
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 font-mono leading-relaxed">
                An unexpected engine glitch occurred while rendering this view. Our pit crew has been alerted.
              </p>
            </div>

            {/* Diagnostic Message (Truncated) */}
            {this.state.error && (
              <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-xl p-3.5 text-left font-mono text-[11px] text-zinc-400 overflow-x-auto max-h-28 space-y-1">
                <span className="text-red-400 font-bold uppercase block text-[10px]">Diagnostic Trace:</span>
                <span className="text-zinc-300 break-words">{this.state.error.message || 'Unknown runtime exception'}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={this.handleReload}
                className="bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase px-6 py-3 rounded-xl shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Restart Session</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-bold uppercase px-6 py-3 rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                <Home className="w-4 h-4" />
                <span>Return to Showroom</span>
              </button>
            </div>

            {/* Support Link */}
            <div className="border-t border-zinc-800 pt-4 text-center">
              <a
                href="https://wa.me/8431294886?text=Hello%20Redline%20Garage%20Support%2C%20I%20encountered%20an%20issue%20on%20the%20website"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Need urgent assistance? WhatsApp Support (+91 8431294886)</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
