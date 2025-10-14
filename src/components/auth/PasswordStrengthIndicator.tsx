import { useMemo } from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = "weak" | "medium" | "strong";

interface StrengthCriteria {
  hasMinLength: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

/**
 * Visual indicator of password strength
 */
export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const criteria = useMemo<StrengthCriteria>(() => {
    return {
      hasMinLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  }, [password]);

  const strength = useMemo<StrengthLevel>(() => {
    const metCriteriaCount = Object.values(criteria).filter(Boolean).length;

    if (metCriteriaCount === 3) return "strong";
    if (metCriteriaCount === 2) return "medium";
    return "weak";
  }, [criteria]);

  const getStrengthColor = (level: StrengthLevel): string => {
    switch (level) {
      case "strong":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "weak":
        return "bg-red-500";
    }
  };

  const getStrengthLabel = (level: StrengthLevel): string => {
    switch (level) {
      case "strong":
        return "Strong";
      case "medium":
        return "Medium";
      case "weak":
        return "Weak";
    }
  };

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex gap-2">
        <div className={`h-1 flex-1 rounded ${password.length > 0 ? getStrengthColor(strength) : "bg-gray-200"}`} />
        <div className={`h-1 flex-1 rounded ${strength !== "weak" ? getStrengthColor(strength) : "bg-gray-200"}`} />
        <div className={`h-1 flex-1 rounded ${strength === "strong" ? getStrengthColor(strength) : "bg-gray-200"}`} />
      </div>

      {/* Strength label */}
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Password strength:{" "}
        <span
          className={
            strength === "strong" ? "text-green-600" : strength === "medium" ? "text-yellow-600" : "text-red-600"
          }
        >
          {getStrengthLabel(strength)}
        </span>
      </p>

      {/* Criteria checklist */}
      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
        <li className={criteria.hasMinLength ? "text-green-600 dark:text-green-400" : ""}>
          {criteria.hasMinLength ? "✓" : "○"} At least 8 characters
        </li>
        <li className={criteria.hasNumber ? "text-green-600 dark:text-green-400" : ""}>
          {criteria.hasNumber ? "✓" : "○"} Contains a number
        </li>
        <li className={criteria.hasSpecialChar ? "text-green-600 dark:text-green-400" : ""}>
          {criteria.hasSpecialChar ? "✓" : "○"} Contains a special character
        </li>
      </ul>
    </div>
  );
}
