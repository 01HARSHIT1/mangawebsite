'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Bug, Send } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isReporting: boolean;
  userEmail: string;
  userMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isReporting: false,
      userEmail: '',
      userMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorId: null,
      isReporting: false,
      userEmail: '',
      userMessage: ''
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Generate unique error ID
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Send error to monitoring service
    this.logError(error, errorInfo, errorId);
  }

  logError = async (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    try {
      const errorData = {
        errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('userId') || null,
        sessionId: sessionStorage.getItem('sessionId') || null
      };

      // Send to error logging endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  };

  handleReportError = async () => {
    const { error, errorInfo, errorId, userEmail, userMessage } = this.state;

    if (!userEmail.trim()) return;

    this.setState({ isReporting: true });

    try {
      const reportData = {
        errorId,
        userEmail,
        userMessage,
        error: error?.message,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });

      // Show success message
      alert('Thank you for reporting this error. We\'ll investigate and fix it soon!');

      // Reset form
      this.setState({
        userEmail: '',
        userMessage: '',
        isReporting: false
      });
    } catch (error) {
      console.error('Failed to report error:', error);
      alert('Failed to send error report. Please try again.');
      this.setState({ isReporting: false });
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId, isReporting, userEmail, userMessage } = this.state;

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
          >
            {/* Error Icon */}
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-white mb-4">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-400 mb-6">
              We encountered an unexpected error. Our team has been notified and is working to fix it.
            </p>

            {/* Error ID */}
            {errorId && (
              <div className="bg-gray-700 rounded-lg p-3 mb-6">
                <p className="text-sm text-gray-300 mb-1">
                  <code className="text-xs text-gray-400 break-all">{errorId}</code>
                </p>
              </div>
            )}

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="text-left mb-6">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 mb-2">
                  Error Details (Development)
                </summary>
                <div className="bg-gray-700 rounded-lg p-3 text-xs text-red-400 font-mono overflow-auto max-h-32">
                  <div className="mb-2">
                    <strong>Message:</strong> {error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                  </div>
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 mb-6">
              <button
                onClick={this.handleRetry}
                className="w-full flex items-center justify-center gap-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            {/* Error Report Form */}
            <div className="border-t border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bug className="w-5 h-5 text-yellow-400" />
                Report This Error
              </h3>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email (optional)"
                  value={userEmail}
                  onChange={(e) => this.setState({ userEmail: e.target.value })}
                  className="w-full px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <textarea
                  placeholder="What were you doing when this error occurred? (optional)"
                  value={userMessage}
                  onChange={(e) => this.setState({ userMessage: e.target.value })}
                  rows={3}
                  className="w-full px-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                />
                <button
                  onClick={this.handleReportError}
                  disabled={isReporting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors">
                  {isReporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 