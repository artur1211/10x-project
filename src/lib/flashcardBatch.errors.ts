// Base error class for flashcard batch operations
export class FlashcardBatchError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "FlashcardBatchError";
    Object.setPrototypeOf(this, FlashcardBatchError.prototype);
  }
}

// Batch not found error
export class BatchNotFoundError extends FlashcardBatchError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "BatchNotFoundError";
  }
}

// Batch already reviewed error
export class BatchAlreadyReviewedError extends FlashcardBatchError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "BatchAlreadyReviewedError";
  }
}

// Flashcard limit exceeded error
export class FlashcardLimitExceededError extends FlashcardBatchError {
  constructor(
    message: string,
    public currentCount: number,
    public limit: number,
    details?: unknown
  ) {
    super(message, details);
    this.name = "FlashcardLimitExceededError";
  }
}

// Validation error
export class ValidationError extends FlashcardBatchError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "ValidationError";
  }
}

// Flashcard generation error
export class FlashcardGenerationError extends FlashcardBatchError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "FlashcardGenerationError";
  }
}
