import { useId } from "react";
import type { FlashcardGeneratorFormProps } from "../types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CharacterCounter } from "./CharacterCounter";
import { useCharacterCount } from "../hooks/useCharacterCount";

/**
 * Form for text input and flashcard generation
 */
export function FlashcardGeneratorForm({
  inputText,
  onInputChange,
  onGenerate,
  isGenerating,
  isDisabled,
}: FlashcardGeneratorFormProps) {
  const textareaId = useId();
  const counterId = useId();
  const charCount = useCharacterCount(inputText, 1000, 10000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (charCount.isValid && !isGenerating) {
      await onGenerate(inputText);
    }
  };

  const getButtonTooltip = () => {
    if (!charCount.isValid) {
      if (charCount.status === "too-short") {
        return "Enter at least 1,000 characters";
      }
      if (charCount.status === "too-long") {
        return "Reduce to 10,000 characters or less";
      }
    }
    return undefined;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="flashcard-form">
      <div className="space-y-2">
        <Label htmlFor={textareaId} className="text-base font-semibold">
          Study Material Text
        </Label>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Paste your study material here (1,000-10,000 characters). The AI will generate flashcards based on the key
          concepts.
        </p>
        <Textarea
          id={textareaId}
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Paste your study material here..."
          className="h-[300px] resize-none"
          disabled={isGenerating || isDisabled}
          aria-describedby={counterId}
          data-testid="input-textarea"
        />
        <CharacterCounter
          current={charCount.current}
          min={charCount.min}
          max={charCount.max}
          status={charCount.status}
          className="mt-2"
        />
      </div>

      <Button
        type="submit"
        disabled={!charCount.isValid || isGenerating || isDisabled}
        className="w-full sm:w-auto"
        title={getButtonTooltip()}
        data-testid="generate-button"
      >
        {isGenerating ? "Generating..." : "Generate Flashcards"}
      </Button>
    </form>
  );
}
