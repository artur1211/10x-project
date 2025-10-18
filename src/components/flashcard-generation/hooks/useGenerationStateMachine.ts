import { useState, useCallback } from "react";
import type { GenerationState, GenerateFlashcardsResponse, ReviewFlashcardsResponse, ApiError } from "../types";

/**
 * Hook for managing generation workflow state machine
 * Handles state transitions: idle -> generating -> reviewing -> submitting -> success/error
 */
export function useGenerationStateMachine() {
  const [generationState, setGenerationState] = useState<GenerationState>({
    status: "idle",
  });

  const setGenerating = useCallback(() => {
    setGenerationState({ status: "generating" });
  }, []);

  const setReviewing = useCallback((data: GenerateFlashcardsResponse) => {
    setGenerationState({ status: "reviewing", data });
  }, []);

  const setSubmitting = useCallback(() => {
    setGenerationState({ status: "submitting" });
  }, []);

  const setSuccess = useCallback((data: ReviewFlashcardsResponse) => {
    setGenerationState({ status: "success", data });
  }, []);

  const setError = useCallback((error: ApiError, phase: "generation" | "review") => {
    setGenerationState({ status: "error", error, phase });
  }, []);

  const reset = useCallback(() => {
    setGenerationState({ status: "idle" });
  }, []);

  return {
    generationState,
    setGenerating,
    setReviewing,
    setSubmitting,
    setSuccess,
    setError,
    reset,
  };
}
