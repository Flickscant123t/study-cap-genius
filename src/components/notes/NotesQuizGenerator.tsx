import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Note } from "@/hooks/useNotes";
import { usePreferences } from "@/hooks/usePreferences";
import { useToast } from "@/hooks/use-toast";
import {
  Brain,
  Loader2,
  Check,
  X,
  ChevronRight,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotesQuizGeneratorProps {
  note: Note;
  onClose: () => void;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function NotesQuizGenerator({ note, onClose }: NotesQuizGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const { preferences } = usePreferences();
  const { toast } = useToast();

  const generateQuiz = async () => {
    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setQuizComplete(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notes-ai`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "generate-quiz",
            noteTitle: note.title,
            noteContent: note.content,
            persona: preferences?.study_persona || "scholar",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not generate questions from this note.",
        });
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);

    if (index === questions[currentIndex].correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-lg">Knowledge Quiz</h2>
          <p className="text-sm text-muted-foreground">Test your understanding</p>
        </div>
      </div>

      {!loading && questions.length === 0 && !quizComplete && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Generate a 5-question quiz based on your note content.
          </p>
          <Button variant="hero" onClick={generateQuiz}>
            <Brain className="w-4 h-4" />
            Generate Quiz
          </Button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Creating your quiz...</p>
        </div>
      )}

      {!loading && questions.length > 0 && !quizComplete && currentQuestion && (
        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>Score: {score}/{currentIndex + (showResult ? 1 : 0)}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="p-4 bg-secondary/30 rounded-xl">
            <p className="text-lg font-medium">{currentQuestion.question}</p>
          </div>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isCorrect = index === currentQuestion.correctIndex;
              const isSelected = index === selectedAnswer;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={showResult}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border-2 transition-all",
                    !showResult && "hover:border-primary/50 hover:bg-primary/5",
                    showResult && isCorrect && "border-green-500 bg-green-500/10",
                    showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                    !showResult && "border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                        showResult && isCorrect && "bg-green-500 text-white",
                        showResult && isSelected && !isCorrect && "bg-destructive text-white",
                        !showResult && "bg-muted"
                      )}
                    >
                      {showResult && isCorrect ? (
                        <Check className="w-4 h-4" />
                      ) : showResult && isSelected ? (
                        <X className="w-4 h-4" />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </div>
                    <span className="flex-1">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="p-4 bg-muted/50 rounded-xl">
              <p className="text-sm font-medium mb-1">Explanation:</p>
              <p className="text-sm text-muted-foreground">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {showResult && (
            <Button variant="hero" onClick={nextQuestion} className="w-full">
              {currentIndex < questions.length - 1 ? (
                <>
                  Next Question
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  See Results
                  <Trophy className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {quizComplete && (
        <div className="text-center py-8">
          <Trophy
            className={cn(
              "w-16 h-16 mx-auto mb-4",
              score >= questions.length * 0.8
                ? "text-yellow-500"
                : score >= questions.length * 0.5
                ? "text-gray-400"
                : "text-orange-500"
            )}
          />
          <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
          <p className="text-lg text-muted-foreground mb-6">
            You scored {score} out of {questions.length} (
            {Math.round((score / questions.length) * 100)}%)
          </p>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="hero" onClick={generateQuiz}>
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
