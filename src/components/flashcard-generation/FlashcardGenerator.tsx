import { useFlashcardGeneration } from "./hooks/useFlashcardGeneration";
import { FlashcardGeneratorForm } from "./components/FlashcardGeneratorForm";
import { LoadingIndicator } from "./components/LoadingIndicator";
import { ErrorDisplay } from "./components/ErrorDisplay";
import { CardReviewSection } from "./components/CardReviewSection";
import { EditCardModal } from "./components/EditCardModal";
import { SuccessConfirmation } from "./components/SuccessConfirmation";

/**
 * Main orchestrating component for flashcard generation workflow
 */
export function FlashcardGenerator() {
  const {
    inputText,
    setInputText,
    generationState,
    cardReviews,
    editModalState,
    canSubmitReview,
    generateFlashcards,
    acceptCard,
    rejectCard,
    openEditModal,
    closeEditModal,
    saveEdit,
    acceptAll,
    rejectAll,
    submitReview,
    reset,
    retryGeneration,
    dismissError,
  } = useFlashcardGeneration();

  // Get current card for edit modal (use edited version if available)
  const currentEditCard =
    editModalState.cardIndex !== null
      ? (() => {
          const review = cardReviews.find((r) => r.index === editModalState.cardIndex);
          return review ? review.editedCard || review.originalCard : null;
        })()
      : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Idle state: Show input form */}
      {generationState.status === "idle" && (
        <FlashcardGeneratorForm
          inputText={inputText}
          onInputChange={setInputText}
          onGenerate={generateFlashcards}
          isGenerating={false}
          isDisabled={false}
        />
      )}

      {/* Generating state: Show loading */}
      {generationState.status === "generating" && <LoadingIndicator message="Generating flashcards..." />}

      {/* Error state: Show error display */}
      {generationState.status === "error" && (
        <div className="space-y-4">
          <ErrorDisplay
            error={generationState.error}
            onRetry={generationState.phase === "generation" ? retryGeneration : undefined}
            onDismiss={dismissError}
          />
          {/* Show form again for generation errors */}
          {generationState.phase === "generation" && (
            <FlashcardGeneratorForm
              inputText={inputText}
              onInputChange={setInputText}
              onGenerate={generateFlashcards}
              isGenerating={false}
              isDisabled={false}
            />
          )}
        </div>
      )}

      {/* Reviewing state: Show card review interface */}
      {generationState.status === "reviewing" && (
        <CardReviewSection
          cards={generationState.data.generated_cards}
          reviewStates={cardReviews}
          onAccept={acceptCard}
          onReject={rejectCard}
          onEdit={openEditModal}
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onSubmit={submitReview}
          isSubmitting={false}
          canSubmit={canSubmitReview}
        />
      )}

      {/* Submitting state: Show loading */}
      {generationState.status === "submitting" && <LoadingIndicator message="Saving flashcards..." />}

      {/* Edit modal (rendered conditionally based on editModalState) */}
      <EditCardModal
        isOpen={editModalState.isOpen}
        card={currentEditCard}
        cardIndex={editModalState.cardIndex}
        onSave={saveEdit}
        onCancel={closeEditModal}
      />

      {/* Success modal */}
      {generationState.status === "success" && (
        <SuccessConfirmation
          isOpen={true}
          result={generationState.data}
          onViewFlashcards={() => (window.location.href = "/flashcards")}
          onGenerateMore={reset}
        />
      )}
    </div>
  );
}
