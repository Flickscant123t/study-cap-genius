import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flashcard } from "@/hooks/useFlashcards";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Shuffle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface BrowseModeProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

export function BrowseMode({ flashcards, onClose }: BrowseModeProps) {
  const [cards, setCards] = useState<Flashcard[]>(flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const currentCard = cards[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
      setFlipped(false);
    }
  }, [currentIndex, cards.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  const shuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground mb-4">No flashcards to browse.</p>
        <Button variant="outline" onClick={onClose}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4 mr-1" />
            Exit
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {cards.length}
          </span>
          <Button variant="ghost" size="sm" onClick={shuffle}>
            <Shuffle className="w-4 h-4 mr-1" />
            Shuffle
          </Button>
        </div>

        <Progress
          value={((currentIndex + 1) / cards.length) * 100}
          className="mb-8"
        />

        {/* Flip Card */}
        {currentCard && (
          <div
            className="perspective-1000 cursor-pointer mb-8"
            onClick={() => setFlipped((f) => !f)}
          >
            <div
              className={cn(
                "relative w-full transition-transform duration-500",
                "[transform-style:preserve-3d]",
                flipped && "[transform:rotateY(180deg)]"
              )}
            >
              {/* Front */}
              <Card className="p-8 min-h-[300px] flex flex-col items-center justify-center text-center [backface-visibility:hidden]">
                <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide">
                  Question
                </p>
                <p className="text-2xl font-semibold">{currentCard.front}</p>
                <p className="text-sm text-muted-foreground mt-8">
                  Click or press Space to flip
                </p>
              </Card>

              {/* Back */}
              <Card className="absolute inset-0 p-8 min-h-[300px] flex flex-col items-center justify-center text-center [backface-visibility:hidden] [transform:rotateY(180deg)] bg-primary/5">
                <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wide">
                  Answer
                </p>
                <p className="text-2xl">{currentCard.back}</p>
                <p className="text-sm text-muted-foreground mt-8">
                  Click or press Space to flip back
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={goPrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentIndex(0);
              setFlipped(false);
            }}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Restart
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={goNext}
            disabled={currentIndex === cards.length - 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Use ← → arrow keys to navigate
        </p>
      </div>
    </div>
  );
}
