import type { CardReviewSectionProps } from "../types";
import { BulkActionBar } from "./BulkActionBar";
import { CardReviewGrid } from "./CardReviewGrid";
import { calculateBulkSummary } from "../utils";
import { useMemo } from "react";

/**
 * Container for card review interface
 */
export function CardReviewSection({
  cards,
  reviewStates,
  onAccept,
  onReject,
  onEdit,
  onAcceptAll,
  onRejectAll,
  onSubmit,
  isSubmitting,
  canSubmit,
}: CardReviewSectionProps) {
  const bulkSummary = useMemo(() => calculateBulkSummary(reviewStates), [reviewStates]);

  return (
    <section className="space-y-6" data-testid="card-review-section">
      <div>
        <h2 className="text-2xl font-bold">Review Generated Flashcards</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review each card and decide whether to accept, edit, or reject it. You can also use the bulk actions below to
          process all cards at once.
        </p>
      </div>

      <BulkActionBar
        summary={bulkSummary}
        onAcceptAll={onAcceptAll}
        onRejectAll={onRejectAll}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        canSubmit={canSubmit}
      />

      <CardReviewGrid
        cards={cards}
        reviewStates={reviewStates}
        onAccept={onAccept}
        onReject={onReject}
        onEdit={onEdit}
      />

      {/* Sticky bottom action bar for mobile */}
      <div className="sticky bottom-4 md:hidden">
        <BulkActionBar
          summary={bulkSummary}
          onAcceptAll={onAcceptAll}
          onRejectAll={onRejectAll}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          canSubmit={canSubmit}
        />
      </div>
    </section>
  );
}
