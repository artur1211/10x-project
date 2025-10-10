import type { BulkActionBarProps } from "../types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * Bulk action bar with summary statistics and action buttons
 */
export function BulkActionBar({
  summary,
  onAcceptAll,
  onRejectAll,
  onSubmit,
  isSubmitting,
  canSubmit,
}: BulkActionBarProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      {/* Summary statistics */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="font-semibold">
          Total: <span className="text-primary">{summary.total}</span>
        </div>
        <div className="text-green-600 dark:text-green-400">✓ Accepted: {summary.accepted}</div>
        <div className="text-blue-600 dark:text-blue-400">✏ Edited: {summary.edited}</div>
        <div className="text-red-600 dark:text-red-400">✗ Rejected: {summary.rejected}</div>
        <div className="text-gray-600 dark:text-gray-400">⏸ Pending: {summary.pending}</div>
      </div>

      {/* Warning message when conditions not met */}
      {!canSubmit && summary.pending > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Please review all {summary.pending} pending card{summary.pending !== 1 ? "s" : ""} before saving
          </AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onAcceptAll} variant="outline" size="sm" disabled={isSubmitting || summary.pending === 0}>
          Accept All
        </Button>
        <Button onClick={onRejectAll} variant="outline" size="sm" disabled={isSubmitting || summary.pending === 0}>
          Reject All
        </Button>
        <div className="flex-1" />
        <Button
          onClick={onSubmit}
          disabled={!canSubmit || isSubmitting}
          size="sm"
          className="min-w-[150px]"
          title={
            !canSubmit && summary.pending > 0
              ? `Review all ${summary.pending} pending card${summary.pending !== 1 ? "s" : ""} first`
              : `Save decisions for ${summary.total} card(s)`
          }
        >
          {isSubmitting ? "Saving..." : `Save Decisions (${summary.accepted + summary.edited})`}
        </Button>
      </div>
    </div>
  );
}
