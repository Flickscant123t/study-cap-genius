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
import { useWeakPoints } from "@/hooks/useWeakPoints";
import { AppLayout } from "@/components/layout/AppLayout";
import { MagicPaste } from "@/components/flashcards/MagicPaste";
import { StudyMode } from "@/components/flashcards/StudyMode";
import { 
  Plus, 
  Play,
  Loader2,
  CreditCard,
  Trash2,
  BookOpen,
  Sparkles,
  Wand2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = 'list' | 'study' | 'create' | 'magic-paste';

export default function Flashcards() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user, isPremium, loading: authLoading } = useAuth();
  const { flashcards, loading, getDueCards, createFlashcard, deleteFlashcard } = useFlashcards();
  const { notes } = useNotes();
  const { isWeakPoint, getTopWeakPoints } = useWeakPoints();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    if (!authLoading && !isPremium) navigate('/dashboard');
  }, [user, isPremium, authLoading, navigate]);

  if (!isPremium) return null;

  const dueCards = getDueCards();
  const topWeakPoints = getTopWeakPoints(3);

  const getMasteryScore = () => {
    if (flashcards.length === 0) return 0;
    const avgEase = flashcards.reduce((sum, c) => sum + Number(c.ease_factor), 0) / flashcards.length;
    const avgReps = flashcards.reduce((sum, c) => sum + c.repetitions, 0) / flashcards.length;
    return Math.min(100, Math.round(((avgEase - 1.3) / 1.7) * 50 + Math.min(avgReps * 10, 50)));
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
        <StudyMode onClose={() => setViewMode('list')} />
      </AppLayout>
    );
  }

  if (viewMode === 'magic-paste') {
    return (
      <AppLayout title="Magic Paste">
        <div className="flex-1 flex items-center justify-center p-8">
          <MagicPaste 
            onComplete={() => setViewMode('list')} 
            onCancel={() => setViewMode('list')}
          />
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
            <Button variant="outline" onClick={() => setViewMode('magic-paste')}>
              <Wand2 className="w-4 h-4" />
              Magic Paste
            </Button>
            <Button variant="outline" onClick={() => setViewMode('create')}>
              <Plus className="w-4 h-4" />
              Create
            </Button>
            <Button 
              variant="hero" 
              onClick={() => setViewMode('study')}
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
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{masteryScore}%</p>
                <p className="text-sm text-muted-foreground">Mastery Score</p>
              </div>
            </div>
            <Progress value={masteryScore} className="mt-2 h-2" />
          </Card>
        </div>

        {/* Weak Points Alert */}
        {topWeakPoints.length > 0 && (
          <Card className="p-4 mb-6 bg-orange-500/5 border-orange-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-orange-600">Topics that need extra practice:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {topWeakPoints.map((wp, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-600">
                      {wp.topic} ({wp.count}x)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

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
              Create flashcards manually or use Magic Paste to generate them from your notes.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setViewMode('magic-paste')}>
                <Wand2 className="w-4 h-4" />
                Magic Paste
              </Button>
              <Button variant="hero" onClick={() => setViewMode('create')}>
                <Plus className="w-4 h-4" />
                Create Flashcard
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flashcards.map(card => {
              const cardIsWeak = isWeakPoint(card.front);
              return (
                <Card 
                  key={card.id} 
                  className={cn(
                    "p-4 hover:shadow-md transition-shadow",
                    cardIsWeak && "border-orange-500/30 bg-orange-500/5"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        card.next_review && card.next_review <= new Date().toISOString()
                          ? "bg-orange-500/10 text-orange-500"
                          : "bg-accent/10 text-accent"
                      )}>
                        {card.next_review && card.next_review <= new Date().toISOString() ? "Due" : "Learned"}
                      </span>
                      {cardIsWeak && (
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
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
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
