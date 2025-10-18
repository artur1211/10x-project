import { memo } from "react";
import type { GeneratedCardItemProps } from "../types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Individual generated card with flip functionality and actions
 */
export const GeneratedCardItem = memo(function GeneratedCardItem({
  card,
  reviewState,
  onAccept,
  onReject,
  onEdit,
}: GeneratedCardItemProps) {
  const displayCard = reviewState.editedCard || reviewState.originalCard;

  // Determine card styling based on action state
  const getCardClassName = () => {
    const baseClass = "transition-all duration-200";
    switch (reviewState.action) {
      case "accept":
        return `${baseClass} border-green-500 dark:border-green-600`;
      case "reject":
        return `${baseClass} border-red-500 dark:border-red-600 opacity-50`;
      case "edit":
        return `${baseClass} border-blue-500 dark:border-blue-600`;
      default:
        return baseClass;
    }
  };

  // Get badge styling based on action
  const getBadgeVariant = () => {
    switch (reviewState.action) {
      case "accept":
        return "default" as const;
      case "reject":
        return "destructive" as const;
      case "edit":
        return "default" as const;
      default:
        return "secondary" as const;
    }
  };

  const getBadgeText = () => {
    switch (reviewState.action) {
      case "accept":
        return "Accepted";
      case "reject":
        return "Rejected";
      case "edit":
        return "Edited";
      default:
        return "Pending";
    }
  };

  return (
    <Card className={getCardClassName()} data-testid={`generated-card-${card.index}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Card {card.index + 1}</span>
          <Badge variant={getBadgeVariant()} data-testid={`card-badge-${card.index}`}>
            {getBadgeText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Card content - show both sides */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Front:</div>
            <p className="text-base leading-relaxed" data-testid={`card-front-${card.index}`}>
              {displayCard.front_text}
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">Back:</div>
            <p className="text-base leading-relaxed" data-testid={`card-back-${card.index}`}>
              {displayCard.back_text}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onAccept(card.index)}
            variant={reviewState.action === "accept" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            data-testid={`accept-button-${card.index}`}
          >
            {reviewState.action === "accept" ? "✓ Accepted" : "Accept"}
          </Button>
          <Button
            onClick={() => onEdit(card.index)}
            variant={reviewState.action === "edit" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            data-testid={`edit-button-${card.index}`}
          >
            {reviewState.action === "edit" ? "✓ Edited" : "Edit"}
          </Button>
          <Button
            onClick={() => onReject(card.index)}
            variant={reviewState.action === "reject" ? "destructive" : "outline"}
            size="sm"
            className="flex-1"
            data-testid={`reject-button-${card.index}`}
          >
            {reviewState.action === "reject" ? "✓ Rejected" : "Reject"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
