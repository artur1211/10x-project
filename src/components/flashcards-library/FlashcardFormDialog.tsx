import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { FlashcardDTO, CreateFlashcardCommand, UpdateFlashcardCommand } from "@/types";

interface FlashcardFormDialogProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: FlashcardDTO;
  onSubmit: (data: CreateFlashcardCommand | UpdateFlashcardCommand) => Promise<void>;
  onClose: () => void;
}

interface FormData {
  front_text: string;
  back_text: string;
}

interface ValidationErrors {
  front_text?: string;
  back_text?: string;
}

const FRONT_MIN = 10;
const FRONT_MAX = 500;
const BACK_MIN = 10;
const BACK_MAX = 1000;

export function FlashcardFormDialog({ isOpen, mode, initialData, onSubmit, onClose }: FlashcardFormDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    front_text: "",
    back_text: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when dialog opens or mode changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setFormData({
          front_text: initialData.front_text,
          back_text: initialData.back_text,
        });
      } else {
        setFormData({
          front_text: "",
          back_text: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    if (name === "front_text") {
      if (value.length < FRONT_MIN) {
        return `Front text must be at least ${FRONT_MIN} characters`;
      }
      if (value.length > FRONT_MAX) {
        return `Front text must not exceed ${FRONT_MAX} characters`;
      }
    } else if (name === "back_text") {
      if (value.length < BACK_MIN) {
        return `Back text must be at least ${BACK_MIN} characters`;
      }
      if (value.length > BACK_MAX) {
        return `Back text must not exceed ${BACK_MAX} characters`;
      }
    }
    return undefined;
  };

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    const frontError = validateField("front_text", formData.front_text);
    if (frontError) {
      newErrors.front_text = frontError;
    }

    const backError = validateField("back_text", formData.back_text);
    if (backError) {
      newErrors.back_text = backError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch {
      // Error handling is done in the parent component
      // Error is already logged by the parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid =
    formData.front_text.length >= FRONT_MIN &&
    formData.front_text.length <= FRONT_MAX &&
    formData.back_text.length >= BACK_MIN &&
    formData.back_text.length <= BACK_MAX &&
    Object.keys(errors).length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{mode === "create" ? "Create New Flashcard" : "Edit Flashcard"}</DialogTitle>
            <DialogDescription>
              {mode === "create" ? "Add a new flashcard to your collection" : "Make changes to your flashcard"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Front Text */}
            <div className="space-y-2">
              <Label htmlFor="front_text">
                Front Text
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="front_text"
                value={formData.front_text}
                onChange={(e) => handleChange("front_text", e.target.value)}
                placeholder="Enter the question or prompt..."
                className={errors.front_text ? "border-destructive" : ""}
              />
              <div className="flex justify-between items-center text-xs">
                <span className={errors.front_text ? "text-destructive" : "text-muted-foreground"}>
                  {errors.front_text || `${FRONT_MIN}-${FRONT_MAX} characters`}
                </span>
                <span
                  className={
                    formData.front_text.length > FRONT_MAX
                      ? "text-destructive"
                      : formData.front_text.length < FRONT_MIN
                        ? "text-muted-foreground"
                        : "text-green-600 dark:text-green-500"
                  }
                >
                  {formData.front_text.length} / {FRONT_MAX}
                </span>
              </div>
            </div>

            {/* Back Text */}
            <div className="space-y-2">
              <Label htmlFor="back_text">
                Back Text
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="back_text"
                value={formData.back_text}
                onChange={(e) => handleChange("back_text", e.target.value)}
                placeholder="Enter the answer or explanation..."
                rows={6}
                className={errors.back_text ? "border-destructive" : ""}
              />
              <div className="flex justify-between items-center text-xs">
                <span className={errors.back_text ? "text-destructive" : "text-muted-foreground"}>
                  {errors.back_text || `${BACK_MIN}-${BACK_MAX} characters`}
                </span>
                <span
                  className={
                    formData.back_text.length > BACK_MAX
                      ? "text-destructive"
                      : formData.back_text.length < BACK_MIN
                        ? "text-muted-foreground"
                        : "text-green-600 dark:text-green-500"
                  }
                >
                  {formData.back_text.length} / {BACK_MAX}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
