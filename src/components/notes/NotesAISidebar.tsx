import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Note } from "@/hooks/useNotes";
import { usePreferences } from "@/hooks/usePreferences";
import { useFlashcards } from "@/hooks/useFlashcards";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  FileText, 
  Lightbulb, 
  AlertCircle, 
  Loader2,
  X,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface NotesAISidebarProps {
  note: Note;
  onClose: () => void;
}

type AIAction = 'summary' | 'insights' | 'gap-analysis';

export function NotesAISidebar({ note, onClose }: NotesAISidebarProps) {
  const [activeAction, setActiveAction] = useState<AIAction | null>(null);
  const [result, setResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  
  const { preferences } = usePreferences();
  const { createFlashcard } = useFlashcards();
  const { toast } = useToast();

  const runAIAction = async (action: AIAction) => {
    setActiveAction(action);
    setResult("");
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notes-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action,
          noteTitle: note.title,
          noteContent: note.content,
          persona: preferences?.study_persona || 'scholar',
        }),
      });

      if (response.status === 429) {
        toast({ variant: 'destructive', title: 'Rate limited', description: 'Please try again in a moment.' });
        setIsLoading(false);
        return;
      }

      if (response.status === 402) {
        toast({ variant: 'destructive', title: 'Credits required', description: 'Please add credits to continue.' });
        setIsLoading(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to get AI response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                content += delta;
                setResult(content);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to get AI response.' });
    } finally {
      setIsLoading(false);
    }
  };

  const generateFlashcards = async () => {
    setGeneratingFlashcards(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notes-ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'generate-flashcards',
          noteTitle: note.title,
          noteContent: note.content,
          persona: preferences?.study_persona || 'scholar',
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to generate flashcards");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) content += delta;
            } catch {
              // Ignore
            }
          }
        }
      }

      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const flashcards = JSON.parse(jsonMatch[0]);
        let created = 0;
        for (const card of flashcards) {
          if (card.front && card.back) {
            await createFlashcard(card.front, card.back, note.id);
            created++;
          }
        }
        toast({ title: 'Flashcards created!', description: `${created} flashcards added from this note.` });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate flashcards.' });
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const actions = [
    { id: 'summary' as AIAction, icon: FileText, label: 'Summary', description: 'Get a concise summary' },
    { id: 'insights' as AIAction, icon: Lightbulb, label: 'Concept Insights', description: 'Understand key concepts' },
    { id: 'gap-analysis' as AIAction, icon: AlertCircle, label: 'Gap Analysis', description: 'Find missing topics' },
  ];

  return (
    <div className="w-80 border-l border-border flex flex-col bg-card">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-2">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => runAIAction(action.id)}
            disabled={isLoading}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
              activeAction === action.id
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-muted"
            )}
          >
            <action.icon className="w-5 h-5 text-primary" />
            <div>
              <p className="font-medium text-sm">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </button>
        ))}

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={generateFlashcards}
          disabled={generatingFlashcards || !note.content}
        >
          {generatingFlashcards ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          Generate Flashcards
        </Button>
      </div>

      {/* Results */}
      {(result || isLoading) && (
        <div className="flex-1 border-t border-border p-4 overflow-y-auto">
          {isLoading && !result && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
          {result && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
