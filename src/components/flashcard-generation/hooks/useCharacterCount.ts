import { useMemo } from "react";
import type { CharacterCountState } from "../types";
import { calculateCharacterCount } from "../utils";

/**
 * Hook for character count validation with memoization
 * @param text - The text to count characters from
 * @param min - Minimum required characters
 * @param max - Maximum allowed characters
 * @returns Character count state with validation
 */
export function useCharacterCount(text: string, min: number, max: number): CharacterCountState {
  return useMemo(() => calculateCharacterCount(text, min, max), [text, min, max]);
}
