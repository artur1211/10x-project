import type { ErrorDisplayProps } from "../types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

/**
 * Error display with contextual actions
 */
export function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  // Determine error configuration based on error type
  const getErrorConfig = () => {
    const errorCode = error.error;

    switch (errorCode) {
      case "Too Many Requests":
        return {
          title: "Generation Limit Reached",
          showRetry: false,
          showManualCreation: true,
        };
      case "Service Unavailable":
        return {
          title: "Service Temporarily Unavailable",
          showRetry: true,
          showManualCreation: false,
        };
      case "FLASHCARD_LIMIT_EXCEEDED":
        return {
          title: "Flashcard Limit Exceeded",
          showRetry: false,
          showManageFlashcards: true,
        };
      case "BATCH_NOT_FOUND":
        return {
          title: "Batch Not Found",
          showRetry: false,
          showManualCreation: false,
        };
      case "BATCH_ALREADY_REVIEWED":
        return {
          title: "Already Processed",
          showRetry: false,
          showViewFlashcards: true,
        };
      case "VALIDATION_ERROR":
      case "Bad Request":
        return {
          title: "Validation Error",
          showRetry: false,
          showManualCreation: false,
        };
      default:
        return {
          title: "Error",
          showRetry: true,
          showManualCreation: false,
        };
    }
  };

  const config = getErrorConfig();

  return (
    <Alert variant="destructive" className="my-4" data-testid="error-display">
      <AlertTitle className="text-lg font-semibold">{config.title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{error.message}</p>

        {/* Display validation details if present */}
        {error.details && error.details.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="font-semibold">Issues found:</p>
            <ul className="list-inside list-disc space-y-1">
              {error.details.map((detail, index) => (
                <li key={index}>
                  {detail.field}: {detail.message}
                  {detail.received_length !== undefined && ` (${detail.received_length} characters)`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Display limit information if present */}
        {error.current_count !== undefined && error.limit !== undefined && (
          <div className="mt-2 space-y-1">
            <p>
              Current flashcards: {error.current_count} / {error.limit}
            </p>
            {error.suggestion && <p className="text-sm italic">{error.suggestion}</p>}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {config.showRetry && onRetry && (
            <Button onClick={onRetry} variant="default" size="sm" data-testid="error-retry-button">
              Retry
            </Button>
          )}

          {config.showManualCreation && (
            <Button onClick={() => (window.location.href = "/flashcards/create")} variant="outline" size="sm">
              Create Manually
            </Button>
          )}

          {config.showManageFlashcards && (
            <Button onClick={() => (window.location.href = "/flashcards")} variant="outline" size="sm">
              Manage Flashcards
            </Button>
          )}

          {config.showViewFlashcards && (
            <Button onClick={() => (window.location.href = "/flashcards")} variant="outline" size="sm">
              View Flashcards
            </Button>
          )}

          {onDismiss && (
            <Button onClick={onDismiss} variant="ghost" size="sm" data-testid="error-dismiss-button">
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
