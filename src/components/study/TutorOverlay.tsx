import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  X,
  Brain,
  Lightbulb,
  Check,
  AlertCircle,
  Loader2,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWeakPoints } from "@/hooks/useWeakPoints";

interface TutorOverlayProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    task_type: string;
  };
  onComplete: (masteryVerified: boolean) => void;
  onStruggling: () => void;
  onClose: () => void;
}

interface Question {
  question: string;
  hints: string[];
  correctAnswer: string;
  explanation: string;
}

interface VerificationResult {
  correct: boolean;
  feedback: string;
  masteryLevel: "needs_work" | "partial" | "mastered";
  deepExplanation?: string;
}

export function TutorOverlay({ task, onComplete, onStruggling, onClose }: TutorOverlayProps) {
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const { addWeakPoint, decrementWeakPoint } = useWeakPoints();

  useEffect(() => {
    generateQuestion();
  }, [task]);

  const generateQuestion = async () => {
    setLoading(true);
    setAnswer("");
    setResult(null);
    setHintsUsed(0);
    setShowHint(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "tutor_question",
          task: {
            title: task.title,
            topic: task.description || task.title,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to generate question");

      const data = await response.json();
      setQuestion(data);
    } catch (error) {
      console.error("Error generating question:", error);
    } finally {
      setLoading(false);
    }
  };

  const verifyAnswer = async () => {
    if (!question || !answer.trim()) return;

    setVerifying(true);

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
            title: task.title,
            correctAnswer: question.correctAnswer,
          },
          answer,
        }),
      });

      if (!response.ok) throw new Error("Failed to verify answer");

      const data: VerificationResult = await response.json();
      setResult(data);

      // Track weak points
      if (!data.correct) {
        addWeakPoint(task.title);
      } else if (data.masteryLevel === "mastered") {
        decrementWeakPoint(task.title);
      }
    } catch (error) {
      console.error("Error verifying answer:", error);
    } finally {
      setVerifying(false);
    }
  };

  const handleHint = () => {
    if (question && hintsUsed < question.hints.length) {
      setHintsUsed((prev) => prev + 1);
      setShowHint(true);
    }
  };

  const handleComplete = () => {
    onComplete(result?.masteryLevel === "mastered");
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-lg">AI Tutor Session</h2>
                <p className="text-sm text-muted-foreground">{task.title}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Preparing your challenge...</p>
            </div>
          ) : question ? (
            <div className="space-y-6">
              {/* Question */}
              <div className="p-4 bg-secondary/50 rounded-xl">
                <p className="text-sm text-muted-foreground mb-2">Question</p>
                <p className="text-lg font-medium">{question.question}</p>
              </div>

              {/* Hints */}
              {showHint && hintsUsed > 0 && (
                <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
                  <div className="flex items-center gap-2 text-accent mb-2">
                    <Lightbulb className="w-4 h-4" />
                    <span className="text-sm font-medium">Hint {hintsUsed}</span>
                  </div>
                  <p className="text-sm">{question.hints[hintsUsed - 1]}</p>
                </div>
              )}

              {/* Answer input */}
              {!result && (
                <>
                  <div>
                    <label className="text-sm font-medium">Your Answer</label>
                    <Textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="mt-2 min-h-[120px]"
                      disabled={verifying}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handleHint}
                      disabled={hintsUsed >= question.hints.length || verifying}
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Hint ({question.hints.length - hintsUsed} left)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onStruggling}
                      className="text-destructive border-destructive hover:bg-destructive/10"
                    >
                      I'm Struggling
                    </Button>
                    <Button
                      variant="hero"
                      onClick={verifyAnswer}
                      disabled={!answer.trim() || verifying}
                      className="ml-auto"
                    >
                      {verifying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Submit Answer
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* Result */}
              {result && (
                <div className="space-y-4">
                  <div
                    className={cn(
                      "p-4 rounded-xl",
                      result.correct
                        ? "bg-green-500/10 border border-green-500/20"
                        : "bg-destructive/10 border border-destructive/20"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {result.correct ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-destructive" />
                      )}
                      <span className={cn("font-semibold", result.correct ? "text-green-500" : "text-destructive")}>
                        {result.correct ? "Correct!" : "Not Quite Right"}
                      </span>
                      <span
                        className={cn(
                          "ml-auto text-xs px-2 py-1 rounded-full",
                          result.masteryLevel === "mastered"
                            ? "bg-green-500/20 text-green-600"
                            : result.masteryLevel === "partial"
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-destructive/20 text-destructive"
                        )}
                      >
                        {result.masteryLevel === "mastered"
                          ? "Mastered!"
                          : result.masteryLevel === "partial"
                          ? "Almost There"
                          : "Needs Practice"}
                      </span>
                    </div>
                    <p className="text-sm">{result.feedback}</p>
                  </div>

                  {/* Deep explanation for wrong answers */}
                  {!result.correct && result.deepExplanation && (
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Deep Explanation</span>
                      </div>
                      <p className="text-sm">{result.deepExplanation}</p>
                    </div>
                  )}

                  {/* Correct answer */}
                  <div className="p-4 bg-secondary/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Correct Answer</p>
                    <p className="text-sm font-medium">{question.correctAnswer}</p>
                    <p className="text-xs text-muted-foreground mt-2">{question.explanation}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    {!result.correct && (
                      <Button variant="outline" onClick={generateQuestion}>
                        Try Another Question
                      </Button>
                    )}
                    <Button
                      variant="hero"
                      onClick={handleComplete}
                      className="ml-auto"
                      disabled={!result.correct && result.masteryLevel === "needs_work"}
                    >
                      {result.correct ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Complete Task
                        </>
                      ) : result.masteryLevel === "partial" ? (
                        "Continue Anyway"
                      ) : (
                        "Must Pass to Continue"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Failed to load question. Please try again.</p>
              <Button variant="outline" onClick={generateQuestion} className="mt-4">
                Retry
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
