import type { LoadingIndicatorProps } from "../types";

/**
 * Loading indicator with spinner and message
 */
export function LoadingIndicator({ message = "Loading...", className = "" }: LoadingIndicatorProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 py-12 ${className}`}
      role="status"
      aria-live="polite"
      data-testid="loading-indicator"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary dark:border-gray-700 dark:border-t-primary" />
      <p className="text-lg font-medium text-gray-700 dark:text-gray-300" data-testid="loading-message">
        {message}
      </p>
    </div>
  );
}
