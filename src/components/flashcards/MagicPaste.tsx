import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useFlashcards } from "@/hooks/useFlashcards";
import { useNotes } from "@/hooks/useNotes";
import {
  Wand2,
  Loader2,
  Sparkles,
  Check,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MagicPasteProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function MagicPaste({ onComplete, onCancel }: MagicPasteProps) {
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState<{ front: string; back: string }[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const { createFlashcard } = useFlashcards();
  const { notes } = useNotes();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!content.trim()) return;

    setGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "generate_flashcards",
          goal: content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate flashcards");
      }

      const data = await response.json();
      setFlashcards(data.flashcards || []);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate flashcards",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAll = async () => {
    for (const card of flashcards) {
      await createFlashcard(card.front, card.back, selectedNoteId);
    }
    toast({
      title: "Flashcards created!",
      description: `${flashcards.length} flashcards added to your deck`,
    });
    onComplete();
  };

  const removeCard = (index: number) => {
    setFlashcards((prev) => prev.filter((_, i) => i !== index));
  };

  const contentLength = content.length;
  const estimatedCards = Math.max(3, Math.min(25, Math.ceil(contentLength / 200)));

  return (
    <Card className="w-full max-w-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center">
          <Wand2 className="w-6 h-6 text-accent-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Magic Paste</h2>
          <p className="text-sm text-muted-foreground">
            Paste your notes and AI will create flashcards automatically
          </p>
        </div>
      </div>

      {flashcards.length === 0 ? (
        <>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your study notes, textbook content, or any material you want to learn..."
            className="min-h-[200px] mb-4"
          />

          {content.length > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              <Sparkles className="w-4 h-4 inline mr-1" />
              AI will generate approximately <strong>{estimatedCards}</strong> flashcards based on content complexity
            </p>
          )}

          <div className="mb-4">
            <label className="text-sm font-medium">Link to Note (Optional)</label>
            <select
              value={selectedNoteId || ""}
              onChange={(e) => setSelectedNoteId(e.target.value || null)}
              className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value="">No link</option>
              {notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleGenerate}
              disabled={!content.trim() || generating}
              className="flex-1"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Flashcards
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Generated {flashcards.length} flashcards. Review and save:
            </p>
          </div>

          <div className="max-h-[400px] overflow-auto space-y-3 mb-6">
            {flashcards.map((card, i) => (
              <div key={i} className="p-4 bg-secondary/30 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Q{i + 1}</p>
                    <p className="font-medium text-sm mb-2">{card.front}</p>
                    <p className="text-xs text-muted-foreground mb-1">Answer</p>
                    <p className="text-sm">{card.back}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCard(i)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setFlashcards([])} className="flex-1">
              Regenerate
            </Button>
            <Button variant="hero" onClick={handleSaveAll} className="flex-1">
              <Check className="w-4 h-4" />
              Save All ({flashcards.length})
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
