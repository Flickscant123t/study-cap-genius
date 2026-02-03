import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFlashcards, Flashcard } from "@/hooks/useFlashcards";
import { useWeakPoints } from "@/hooks/useWeakPoints";
import {
  X,
  ChevronLeft,
  RotateCcw,
  Check,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface StudyModeProps {
  onClose: () => void;
}

export function StudyMode({ onClose }: StudyModeProps) {
  const { flashcards, getDueCards, reviewCard } = useFlashcards();
  const { addWeakPoint, decrementWeakPoint, isWeakPoint } = useWeakPoints();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const dueCards = getDueCards();
  const studyCards = dueCards.length > 0 ? dueCards : flashcards;
  const currentCard = studyCards[currentIndex];

  const isWeak = currentCard ? isWeakPoint(currentCard.front) : false;

  const handleReview = async (quality: number) => {
    if (!currentCard) return;

    await reviewCard(currentCard.id, quality);

    // Track weak points
    if (quality <= 2) {
      addWeakPoint(currentCard.front);
    } else if (quality >= 4) {
      decrementWeakPoint(currentCard.front);
    }

    setShowAnswer(false);
    setShowExplanation(false);
    setExplanation("");

    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Session complete
      onClose();
    }
  };

  const generateDeepExplanation = async () => {
    if (!currentCard || loadingExplanation) return;

    setLoadingExplanation(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "verify_answer",
          task: {
            title: currentCard.front,
            correctAnswer: currentCard.back,
          },
          answer: "I don't know - please explain",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setExplanation(data.deepExplanation || "The concept relates to: " + currentCard.back);
        setShowExplanation(true);
      }
    } catch (error) {
      console.error("Error getting explanation:", error);
    } finally {
      setLoadingExplanation(false);
    }
  };

  if (studyCards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Check className="w-16 h-16 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2>
        <p className="text-muted-foreground text-center mb-6">
          You have no flashcards due for review. Create more cards or check back later.
        </p>
        <Button variant="hero" onClick={onClose}>
          Back to Flashcards
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onClose}>
            <ChevronLeft className="w-4 h-4" />
            Exit Study
          </Button>
          <span className="text-sm text-muted-foreground">
            Card {currentIndex + 1} of {studyCards.length}
          </span>
        </div>

        <Progress value={((currentIndex + 1) / studyCards.length) * 100} className="mb-8" />

        {currentCard && (
          <>
            {/* Weak point indicator */}
            {isWeak && (
              <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600">You've struggled with this before. Take your time!</span>
              </div>
            )}

            {/* Card */}
            <Card
              className={cn(
                "p-8 min-h-[300px] flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                showAnswer ? "bg-primary/5" : "hover:shadow-lg"
              )}
              onClick={() => !showAnswer && setShowAnswer(true)}
            >
              {!showAnswer ? (
                <>
                  <p className="text-xs text-muted-foreground mb-4">QUESTION</p>
                  <p className="text-2xl font-semibold">{currentCard.front}</p>
                  <p className="text-sm text-muted-foreground mt-8">Click to reveal answer</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-4">ANSWER</p>
                  <p className="text-2xl">{currentCard.back}</p>
                </>
              )}
            </Card>

            {/* Deep Explanation */}
            {showAnswer && showExplanation && explanation && (
              <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm font-medium">Deep Explanation</span>
                </div>
                <p className="text-sm">{explanation}</p>
              </div>
            )}

            {/* Actions */}
            {showAnswer && (
              <div className="mt-6 space-y-4">
                {!showExplanation && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={generateDeepExplanation}
                    disabled={loadingExplanation}
                  >
                    {loadingExplanation ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Lightbulb className="w-4 h-4 mr-2" />
                    )}
                    Get Deep Explanation
                  </Button>
                )}

                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    className="flex-col h-auto py-4 border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => handleReview(1)}
                  >
                    <X className="w-5 h-5 mb-1" />
                    <span className="text-xs">Again</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-col h-auto py-4 border-orange-500 text-orange-500 hover:bg-orange-500/10"
                    onClick={() => handleReview(3)}
                  >
                    <RotateCcw className="w-5 h-5 mb-1" />
                    <span className="text-xs">Hard</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-col h-auto py-4 border-primary text-primary hover:bg-primary/10"
                    onClick={() => handleReview(4)}
                  >
                    <Check className="w-5 h-5 mb-1" />
                    <span className="text-xs">Good</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-col h-auto py-4 border-accent text-accent hover:bg-accent/10"
                    onClick={() => handleReview(5)}
                  >
                    <Sparkles className="w-5 h-5 mb-1" />
                    <span className="text-xs">Easy</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
