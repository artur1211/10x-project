import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AuthErrorDisplayProps {
  error: string | null;
  title?: string;
  autoDismissMs?: number;
}

/**
 * Consistent error message display with accessibility and auto-dismiss
 */
export function AuthErrorDisplay({ error, title = "Error", autoDismissMs = 10000 }: AuthErrorDisplayProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!error) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    if (autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [error, autoDismissMs]);

  if (!error || !isVisible) {
    return null;
  }

  return (
    <Alert variant="destructive" role="alert">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}
