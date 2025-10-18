import type { SuccessConfirmationProps } from "../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Success confirmation modal with statistics
 */
export function SuccessConfirmation({ isOpen, result, onViewFlashcards, onGenerateMore }: SuccessConfirmationProps) {
  const totalCreated = result.cards_accepted + result.cards_edited;

  return (
    <Dialog open={isOpen}>
      <DialogContent data-testid="success-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl text-green-600 dark:text-green-400" data-testid="success-title">✓ Flashcards Created!</DialogTitle>
          <DialogDescription>
            Successfully created {totalCreated} flashcard{totalCreated !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="mb-3 font-semibold">Summary:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-green-600 dark:text-green-400">✓ Accepted without changes:</span>
                <span className="font-semibold" data-testid="cards-accepted-count">{result.cards_accepted}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-blue-600 dark:text-blue-400">✏ Edited:</span>
                <span className="font-semibold" data-testid="cards-edited-count">{result.cards_edited}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-red-600 dark:text-red-400">✗ Rejected:</span>
                <span className="font-semibold" data-testid="cards-rejected-count">{result.cards_rejected}</span>
              </li>
            </ul>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your flashcards have been added to your collection and are ready for study.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button onClick={onGenerateMore} variant="outline" className="w-full sm:w-auto" data-testid="generate-more-button">
            Generate More
          </Button>
          <Button onClick={onViewFlashcards} className="w-full sm:w-auto" data-testid="view-flashcards-button">
            View My Flashcards
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
