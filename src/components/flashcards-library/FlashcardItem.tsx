import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { FlashcardViewModel } from "./types";

interface FlashcardItemProps {
  flashcard: FlashcardViewModel;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSelect: () => void;
}

export function FlashcardItem({ flashcard, onEdit, onDelete, onToggleSelect }: FlashcardItemProps) {
  return (
    <Card className={`transition-all ${flashcard.isSelected ? "ring-2 ring-primary" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-0.5">
            <Checkbox
              checked={flashcard.isSelected}
              onCheckedChange={onToggleSelect}
              aria-label={`Select flashcard: ${flashcard.front_text.substring(0, 50)}`}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium line-clamp-2 mb-1">{flashcard.front_text}</p>
            <p className="text-xs text-muted-foreground">
              Created: {new Date(flashcard.created_at).toLocaleDateString()}
              {flashcard.was_edited && " • Edited"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0" title="Edit flashcard">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Delete flashcard"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
