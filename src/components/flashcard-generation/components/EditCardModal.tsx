import { useState, useEffect, useId } from "react";
import type { EditCardModalProps } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CharacterCounter } from "./CharacterCounter";
import { useCharacterCount } from "../hooks/useCharacterCount";

/**
 * Modal for editing card front and back text
 */
export function EditCardModal({ isOpen, card, cardIndex, onSave, onCancel }: EditCardModalProps) {
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");

  const frontId = useId();
  const backId = useId();

  const frontValidation = useCharacterCount(frontText, 10, 500);
  const backValidation = useCharacterCount(backText, 10, 1000);

  const canSave = frontValidation.isValid && backValidation.isValid;

  // Initialize text fields when modal opens
  useEffect(() => {
    if (isOpen && card) {
      setFrontText(card.front_text);
      setBackText(card.back_text);
    }
  }, [isOpen, card]);

  const handleSave = () => {
    if (canSave && cardIndex !== null) {
      onSave(cardIndex, frontText.trim(), backText.trim());
    }
  };

  const handleCancel = () => {
    setFrontText("");
    setBackText("");
    onCancel();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-2xl" data-testid="edit-card-modal">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>Modify the front and back text of the flashcard</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Front text */}
          <div className="space-y-2">
            <Label htmlFor={frontId} className="font-semibold">
              Front Text
            </Label>
            <Textarea
              id={frontId}
              value={frontText}
              onChange={(e) => setFrontText(e.target.value)}
              className="min-h-[120px] resize-y"
              placeholder="Enter front text..."
              data-testid="edit-front-textarea"
            />
            <CharacterCounter
              current={frontValidation.current}
              min={frontValidation.min}
              max={frontValidation.max}
              status={frontValidation.status}
            />
            {!frontValidation.isValid && frontValidation.current > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {frontValidation.status === "too-short"
                  ? "Front text must be at least 10 characters"
                  : "Front text must not exceed 500 characters"}
              </p>
            )}
          </div>

          {/* Back text */}
          <div className="space-y-2">
            <Label htmlFor={backId} className="font-semibold">
              Back Text
            </Label>
            <Textarea
              id={backId}
              value={backText}
              onChange={(e) => setBackText(e.target.value)}
              className="min-h-[120px] resize-y"
              placeholder="Enter back text..."
              data-testid="edit-back-textarea"
            />
            <CharacterCounter
              current={backValidation.current}
              min={backValidation.min}
              max={backValidation.max}
              status={backValidation.status}
            />
            {!backValidation.isValid && backValidation.current > 0 && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {backValidation.status === "too-short"
                  ? "Back text must be at least 10 characters"
                  : "Back text must not exceed 1,000 characters"}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} data-testid="edit-cancel-button">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!canSave}
            title={!canSave ? "Both fields must be valid to save" : undefined}
            data-testid="edit-save-button"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
