import type { CardReviewGridProps } from "../types";
import { GeneratedCardItem } from "./GeneratedCardItem";

/**
 * Responsive grid displaying generated cards for review
 */
export function CardReviewGrid({ cards, reviewStates, onAccept, onReject, onEdit }: CardReviewGridProps) {
  if (cards.length === 0) {
    return <div className="py-12 text-center text-gray-500 dark:text-gray-400">No cards generated</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const reviewState = reviewStates.find((r) => r.index === card.index);
        if (!reviewState) return null;

        return (
          <GeneratedCardItem
            key={card.index}
            card={card}
            reviewState={reviewState}
            onAccept={onAccept}
            onReject={onReject}
            onEdit={onEdit}
          />
        );
      })}
    </div>
  );
}
