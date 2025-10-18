import type { CharacterCounterProps } from "../types";
import { getCharCountMessage, getCharCountColorClass } from "../utils";

/**
 * Character counter with color-coded validation feedback
 */
export function CharacterCounter({ current, min, max, status, className = "" }: CharacterCounterProps) {
  const message = getCharCountMessage({
    current,
    min,
    max,
    isValid: status === "valid" || status === "warning",
    status,
  });
  const colorClass = getCharCountColorClass(status);

  return (
    <div className={`text-sm font-medium ${colorClass} ${className}`} aria-live="polite" aria-atomic="true" data-testid="character-counter">
      {message}
    </div>
  );
}
