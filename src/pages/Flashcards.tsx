import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useFlashcards, Flashcard } from "@/hooks/useFlashcards";
import { useNotes } from "@/hooks/useNotes";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Plus, 
  Play,
  Loader2,
  CreditCard,
  Trash2,
  RotateCcw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = 'list' | 'study' | 'create';

export default function Flashcards() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { flashcards, loading, getDueCards, createFlashcard, reviewCard, deleteFlashcard } = useFlashcards();
  const { notes } = useNotes();

  useEffect(() => {
    if (!user) navigate('/auth');
    if (!isPremium) navigate('/flashcards');
  }, [user, isPremium, navigate]);

  if (!isPremium) return null;

  const dueCards = getDueCards();
  const studyCards = dueCards.length > 0 ? dueCards : flashcards;
  const currentCard = studyCards[currentCardIndex];

  const getMasteryScore = () => {
    if (flashcards.length === 0) return 0;
    const avgEase = flashcards.reduce((sum, c) => sum + Number(c.ease_factor), 0) / flashcards.length;
    const avgReps = flashcards.reduce((sum, c) => sum + c.repetitions, 0) / flashcards.length;
    // Mastery score based on ease factor (1.3-2.5+) and repetitions
    return Math.min(100, Math.round(((avgEase - 1.3) / 1.7) * 50 + Math.min(avgReps * 10, 50)));
  };

  const handleReview = async (quality: number) => {
    if (!currentCard) return;
    await reviewCard(currentCard.id, quality);
    setShowAnswer(false);
    
    if (currentCardIndex < studyCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setViewMode('list');
      setCurrentCardIndex(0);
    }
  };

  const handleCreateFlashcard = async () => {
    if (!newFront.trim() || !newBack.trim()) return;
    await createFlashcard(newFront, newBack, selectedNoteId);
    setNewFront("");
    setNewBack("");
    setSelectedNoteId(null);
    setViewMode('list');
  };

  const masteryScore = getMasteryScore();

  if (viewMode === 'study') {
    return (
      <AppLayout title="Study Mode">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            {/* Progress */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" onClick={() => setViewMode('list')}>
                <ChevronLeft className="w-4 h-4" />
                Exit Study
              </Button>
              <span className="text-sm text-muted-foreground">
                Card {currentCardIndex + 1} of {studyCards.length}
              </span>
            </div>
            <Progress value={((currentCardIndex + 1) / studyCards.length) * 100} className="mb-8" />

            {currentCard ? (
              <>
                {/* Card */}
                <Card 
                  className={cn(
                    "p-8 min-h-[300px] flex flex-col items-center justify-center text-center cursor-pointer transition-all",
                    showAnswer ? "bg-primary/5" : "hover:shadow-lg"
                  )}
                  onClick={() => setShowAnswer(true)}
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

                {/* Rating Buttons */}
                {showAnswer && (
                  <div className="mt-6 grid grid-cols-4 gap-2">
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
                      className="flex-col h-auto py-4 border-green-500 text-green-500 hover:bg-green-500/10"
                      onClick={() => handleReview(5)}
                    >
                      <Sparkles className="w-5 h-5 mb-1" />
                      <span className="text-xs">Easy</span>
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="p-8 text-center">
                <Check className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold mb-2">All Done!</h2>
                <p className="text-muted-foreground mb-4">
                  You've reviewed all cards for now. Great job!
                </p>
                <Button variant="hero" onClick={() => setViewMode('list')}>
                  Back to Flashcards
                </Button>
              </Card>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (viewMode === 'create') {
    return (
      <AppLayout title="Create Flashcard">
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-lg p-6">
            <h2 className="text-xl font-bold mb-6">Create New Flashcard</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Front (Question)</label>
                <Textarea
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="Enter the question..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Back (Answer)</label>
                <Textarea
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="Enter the answer..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Link to Note (Optional)</label>
                <select
                  value={selectedNoteId || ""}
                  onChange={(e) => setSelectedNoteId(e.target.value || null)}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">No link</option>
                  {notes.map(note => (
                    <option key={note.id} value={note.id}>{note.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setViewMode('list')}>
                  Cancel
                </Button>
                <Button variant="hero" className="flex-1" onClick={handleCreateFlashcard}>
                  Create Flashcard
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Flashcards">
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Flashcards</h1>
            <p className="text-muted-foreground">Master your knowledge with spaced repetition</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setViewMode('create')}>
              <Plus className="w-4 h-4" />
              Create
            </Button>
            <Button 
              variant="hero" 
              onClick={() => { setCurrentCardIndex(0); setShowAnswer(false); setViewMode('study'); }}
              disabled={flashcards.length === 0}
            >
              <Play className="w-4 h-4" />
              Study ({dueCards.length} due)
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{flashcards.length}</p>
                <p className="text-sm text-muted-foreground">Total Cards</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{dueCards.length}</p>
                <p className="text-sm text-muted-foreground">Due for Review</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{masteryScore}%</p>
                <p className="text-sm text-muted-foreground">Mastery Score</p>
              </div>
            </div>
            <Progress value={masteryScore} className="mt-2 h-2" />
          </Card>
        </div>

        {/* Cards List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : flashcards.length === 0 ? (
          <Card className="p-16 text-center">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Flashcards Yet</h2>
            <p className="text-muted-foreground mb-4">
              Create flashcards manually or generate them from your notes.
            </p>
            <Button variant="hero" onClick={() => setViewMode('create')}>
              <Plus className="w-4 h-4" />
              Create Flashcard
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcards.map(card => (
              <Card key={card.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded-full",
                    card.next_review <= new Date().toISOString()
                      ? "bg-orange-500/10 text-orange-500"
                      : "bg-green-500/10 text-green-500"
                  )}>
                    {card.next_review <= new Date().toISOString() ? "Due" : "Learned"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteFlashcard(card.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="font-medium mb-2 line-clamp-2">{card.front}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{card.back}</p>
                <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground flex justify-between">
                  <span>Interval: {card.interval}d</span>
                  <span>Ease: {Number(card.ease_factor).toFixed(1)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
