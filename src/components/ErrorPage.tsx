'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Home, Search, ArrowLeft, AlertTriangle, FileText, Users, RefreshCw } from 'lucide-react';

interface ErrorPageProps {
  statusCode: number;
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  showSearchButton?: boolean;
  showBackButton?: boolean;
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  statusCode,
  title,
  message,
  showHomeButton = true,
  showSearchButton = true,
  showBackButton = true
}) => {
  const [isReporting, setIsReporting] = useState(false);

  const getErrorContent = () => {
    switch (statusCode) {
      case 404:
        return {
          title: title || 'Page Not Found',
          message: message || 'The page you\'re looking for doesn\'t exist or has been moved.',
          icon: <FileText className="w-16 h-16 text-blue-400" />,
          suggestions: [
            'Check the URL for typos',
            'Use the search function to find what you\'re looking for',
            'Browse our manga collection',
            'Go back to the homepage'
          ]
        };
      case 500:
        return {
          title: title || 'Server Error',
          message: message || 'Something went wrong on our end. We\'re working to fix it.',
          icon: <AlertTriangle className="w-16 h-16 text-red-400" />,
          suggestions: [
            'Try refreshing the page',
            'Check your internet connection',
            'Wait a few minutes and try again',
            'Contact support if the problem persists'
          ]
        };
      case 403:
        return {
          title: title || 'Access Denied',
          message: message || 'You don\'t have permission to access this page.',
          icon: <AlertTriangle className="w-16 h-16 text-yellow-400" />,
          suggestions: [
            'Make sure you\'re logged in',
            'Check if you have the required permissions',
            'Contact an administrator',
            'Go back to the homepage'
          ]
        };
      default:
        return {
          title: title || 'Something Went Wrong',
          message: message || 'An unexpected error occurred. Please try again.',
          icon: <AlertTriangle className="w-16 h-16 text-gray-400" />,
          suggestions: [
            'Try refreshing the page',
            'Go back to the homepage',
            'Use the search function',
            'Contact support if needed'
          ]
        };
    }
  };

  const handleReportError = async () => {
    setIsReporting(true);
    try {
      const errorData = {
        statusCode,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        userId: localStorage.getItem('userId') || null
      };

      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      });

      alert('Thank you for reporting this error. We\'ll investigate and fix it soon!');
    } catch (error) {
      console.error('Failed to report error:', error);
      alert('Failed to send error report. Please try again.');
    } finally {
      setIsReporting(false);
    }
  };

  const errorContent = getErrorContent();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Error Icon */}
        <div className="mb-8">
          {errorContent.icon}
        </div>

        {/* Error Code */}
        <h1 className="text-8 font-bold text-gray-700 mb-4">
          {statusCode}
        </h1>

        {/* Error Title */}
        <h2 className="text-3 font-bold text-white mb-4">
          {errorContent.title}
        </h2>

        {/* Error Message */}
        <p className="text-xl text-gray-400 max-w-lg mx-auto">
          {errorContent.message}
        </p>

        {/* Suggestions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            What you can try:
          </h3>
          <ul className="space-y-2 text-left max-w-md mx-auto">
            {errorContent.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-400">
                  {suggestion}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {showHomeButton && (
            <Link
              href="/"
              className="flex items-center gap-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          )}

          {showSearchButton && (
            <Link
              href="/series"
              className="flex items-center gap-2 px-6 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Search className="w-4 h-4" />            Browse Manga
            </Link>
          )}

          {showBackButton && (
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-6 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          )}

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 bg-green-60 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />           Refresh Page
          </button>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/series"
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <FileText className="w-6 h-6 text-blue-400" />
            <div className="text-left">              <div className="font-semibold text-white">Browse Manga</div>
              <div className="text-sm text-gray-400">iscover new series</div>
            </div>
          </Link>

          <Link
            href="/series?sort=trending"
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Users className="w-6 h-6 text-green-400" />
            <div className="text-left">              <div className="font-semibold text-white">Trending</div>
              <div className="text-sm text-gray-400">Popular manga</div>
            </div>
          </Link>

          <Link
            href="/contact"
            className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <div className="text-left">              <div className="font-semibold text-white">Contact Support</div>
              <div className="text-sm text-gray-400"> </div>
            </div>
          </Link>
        </div>

        {/* Error Report */}
        {statusCode >= 500 && (
          <div className="border-t border-gray-700 pt-6">
            <p className="text-gray-400 mb-4">
              This error has been automatically reported to our team.
            </p>
            <button
              onClick={handleReportError}
              disabled={isReporting}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors mx-auto"
            >
              {isReporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Reporting...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Report This Error
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ErrorPage; 