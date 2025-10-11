// Base error class
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "OpenRouterError";
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

// Authentication errors (401, 403)
export class OpenRouterAuthError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterAuthError";
  }
}

// Validation errors (400)
export class OpenRouterValidationError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterValidationError";
  }
}

// Rate limit errors (429)
export class OpenRouterRateLimitError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterRateLimitError";
  }
}

// Model errors (404, model not available)
export class OpenRouterModelError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterModelError";
  }
}

// Server errors (500, 502, 503)
export class OpenRouterServerError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterServerError";
  }
}

// Response parsing errors
export class OpenRouterResponseError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterResponseError";
  }
}

// Network/timeout errors
export class OpenRouterNetworkError extends OpenRouterError {
  constructor(message: string, details?: unknown) {
    super(message, details);
    this.name = "OpenRouterNetworkError";
  }
}
