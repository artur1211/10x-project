import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement, type ReactNode } from "react";

// Wrapper component for common providers
interface WrapperProps {
  children: ReactNode;
}

function Wrapper({ children }: WrapperProps) {
  // Add providers here as needed (e.g., QueryClientProvider, etc.)
  return <>{children}</>;
}

// Custom render function with providers
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from testing library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
