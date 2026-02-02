import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes, Note } from "@/hooks/useNotes";
import { AppLayout } from "@/components/layout/AppLayout";
import { NotesAISidebar } from "@/components/notes/NotesAISidebar";
import { 
  Plus, 
  FileText, 
  Trash2, 
  Search,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Notes() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAI, setShowAI] = useState(false);
  
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes();

  useEffect(() => {
    if (!user) navigate('/auth');
    if (!isPremium) navigate('/notes'); // Will show PremiumFeature page
  }, [user, isPremium, navigate]);

  if (!isPremium) return null;

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNote = async () => {
    const note = await createNote("Untitled Note");
    if (note) {
      setSelectedNote(note);
      setEditTitle(note.title);
      setEditContent(note.content);
      setIsEditing(true);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    await updateNote(selectedNote.id, { title: editTitle, content: editContent });
    setSelectedNote({ ...selectedNote, title: editTitle, content: editContent });
    setIsEditing(false);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  };

  return (
    <AppLayout title="Notes">
      <div className="flex-1 flex">
        {/* Notes List */}
        <div className="w-72 border-r border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button size="icon" variant="hero" onClick={handleCreateNote}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
                <p className="text-sm">Click + to create one</p>
              </div>
            ) : (
              filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    selectedNote?.id === note.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  )}
                >
                  <p className="font-medium text-sm truncate">{note.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {note.content || "Empty note"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Note Editor */}
        <div className="flex-1 flex flex-col">
          {selectedNote ? (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xl font-bold border-none px-0 focus-visible:ring-0"
                      placeholder="Note title..."
                    />
                  ) : (
                    <h1 className="text-xl font-bold">{selectedNote.title}</h1>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAI(!showAI)}
                    className={cn(showAI && "bg-primary/10")}
                  >
                    <Sparkles className="w-4 h-4" />
                  </Button>
                  {isEditing ? (
                    <>
                      <Button variant="ghost" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button variant="hero" onClick={handleSaveNote}>
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteNote(selectedNote.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex-1 flex">
                <div className="flex-1 p-4">
                  {isEditing ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-full resize-none border-none focus-visible:ring-0"
                      placeholder="Start writing..."
                    />
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                      {selectedNote.content || (
                        <span className="text-muted-foreground italic">
                          This note is empty. Click "Edit" to add content.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Sidebar */}
                {showAI && (
                  <NotesAISidebar 
                    note={selectedNote} 
                    onClose={() => setShowAI(false)} 
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="p-8 text-center max-w-sm">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Select a Note</h2>
                <p className="text-muted-foreground mb-4">
                  Choose a note from the list or create a new one to get started.
                </p>
                <Button variant="hero" onClick={handleCreateNote}>
                  <Plus className="w-4 h-4" />
                  Create Note
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
