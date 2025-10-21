// Base error class for flashcard operations
export class FlashcardError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "FlashcardError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Flashcard not found error (404)
export class NotFoundError extends FlashcardError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Forbidden operation error (403) - e.g., flashcard limit reached
export class ForbiddenError extends FlashcardError {
  constructor(
    message: string,
    public currentCount?: number,
    public limit?: number,
    details?: unknown
  ) {
    super(message, details);
    this.name = "ForbiddenError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Validation error (400)
export class ValidationError extends FlashcardError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
