import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { CapacityIndicatorProps } from "../types";

export function CapacityIndicator({ userStats }: CapacityIndicatorProps) {
  if (!userStats) {
    return null;
  }

  const percentage = (userStats.total_flashcards / userStats.flashcard_limit) * 100;
  const isNearLimit = percentage >= 90;
  const isAtLimit = percentage >= 100;

  return (
    <Card className="mb-6" data-testid="capacity-indicator">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Flashcard Capacity</h3>
          <span className="text-sm text-muted-foreground">
            {userStats.total_flashcards} / {userStats.flashcard_limit}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAtLimit ? "bg-destructive" : isNearLimit ? "bg-yellow-500" : "bg-primary"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* Warning Message */}
        {isAtLimit && (
          <p className="text-xs text-destructive mt-2">
            You&apos;ve reached your flashcard limit. Delete some cards to create new ones.
          </p>
        )}
        {isNearLimit && !isAtLimit && (
          <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-2">
            You&apos;re approaching your flashcard limit ({userStats.remaining_capacity} remaining).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
