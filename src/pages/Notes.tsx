import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes, Note } from "@/hooks/useNotes";
import { AppLayout } from "@/components/layout/AppLayout";
import { NotesAISidebar } from "@/components/notes/NotesAISidebar";
import { MarkdownEditor } from "@/components/notes/MarkdownEditor";
import { MarkdownPreview } from "@/components/notes/MarkdownPreview";
import { MindMapView } from "@/components/notes/MindMapView";
import { FolderTree } from "@/components/notes/FolderTree";
import { NotesQuizGenerator } from "@/components/notes/NotesQuizGenerator";
import { PremiumLockedView } from "@/components/premium/PremiumLockedView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  FileText,
  Trash2,
  Loader2,
  Sparkles,
  Edit,
  Eye,
  Network,
  Brain,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Notes() {
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "preview" | "mindmap">("editor");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [favoriteNotes, setFavoriteNotes] = useState<string[]>(() => {
    const stored = localStorage.getItem("favorite_notes");
    return stored ? JSON.parse(stored) : [];
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navigate = useNavigate();
  const { user, isPremium, loading: authLoading } = useAuth();
  const { notes, loading, createNote, updateNote, deleteNote } = useNotes();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    localStorage.setItem("favorite_notes", JSON.stringify(favoriteNotes));
  }, [favoriteNotes]);

  // Show premium locked view for non-premium users
  if (!isPremium && !authLoading) {
    return (
      <AppLayout title="Notes">
        <PremiumLockedView
          title="Unlock AI-Powered Notes"
          description="Premium Notes include rich Markdown editing, LaTeX support, AI summaries, mind maps, and quiz generation."
          featureName="Notes"
        />
      </AppLayout>
    );
  }

  const noteList = notes ?? [];

  const handleCreateNote = async () => {
    const note = await createNote("Untitled Note");
    if (note) {
      setSelectedNote(note);
      setEditTitle(note.title);
      setEditContent(note.content);
      setIsEditing(true);
      setViewMode("editor");
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
    setShowQuiz(false);
    setViewMode("preview");
  };

  const toggleFavorite = (noteId: string) => {
    setFavoriteNotes((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  return (
    <AppLayout title="Notes">
      <div className="flex-1 flex">
        {/* Folder Sidebar */}
        <div
          className={cn(
            "border-r border-border flex flex-col bg-card transition-all duration-300",
            sidebarCollapsed ? "w-0 overflow-hidden" : "w-64"
          )}
        >
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="font-semibold text-sm">Notes</span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCreateNote}>
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setSidebarCollapsed(true)}
              >
                <PanelLeftClose className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading || authLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <FolderTree
                notes={noteList}
                selectedNoteId={selectedNote?.id || null}
                onSelectNote={handleSelectNote}
                onSelectFolder={setCurrentFolderId}
                currentFolderId={currentFolderId}
                favoriteNotes={favoriteNotes}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-20 left-2 z-10 h-8 w-8"
              onClick={() => setSidebarCollapsed(false)}
            >
              <PanelLeft className="w-4 h-4" />
            </Button>
          )}

          {selectedNote ? (
            <>
              {/* Note Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-3 flex-1">
                  {isEditing ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xl font-bold border-none px-0 focus-visible:ring-0 max-w-md"
                      placeholder="Note title..."
                    />
                  ) : (
                    <h1 className="text-xl font-bold">{selectedNote.title}</h1>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Tabs */}
                  {!isEditing && (
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                      <TabsList className="h-9">
                        <TabsTrigger value="preview" className="text-xs">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </TabsTrigger>
                        <TabsTrigger value="mindmap" className="text-xs">
                          <Network className="w-3.5 h-3.5 mr-1" />
                          Mind Map
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowQuiz(!showQuiz)}
                    className={cn(showQuiz && "bg-primary/10")}
                    title="Generate Quiz"
                  >
                    <Brain className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAI(!showAI)}
                    className={cn(showAI && "bg-primary/10")}
                    title="AI Assistant"
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
                        <Edit className="w-4 h-4 mr-1" />
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

              {/* Note Content */}
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 overflow-hidden">
                  {showQuiz ? (
                    <div className="p-6 overflow-auto h-full">
                      <NotesQuizGenerator
                        note={selectedNote}
                        onClose={() => setShowQuiz(false)}
                      />
                    </div>
                  ) : isEditing ? (
                    <MarkdownEditor
                      value={editContent}
                      onChange={setEditContent}
                      placeholder="Start writing with Markdown, LaTeX ($...$), or code blocks..."
                    />
                  ) : viewMode === "mindmap" ? (
                    <MindMapView content={selectedNote.content} title={selectedNote.title} />
                  ) : (
                    <div className="h-full overflow-auto p-6">
                      <MarkdownPreview content={selectedNote.content} />
                    </div>
                  )}
                </div>

                {/* AI Sidebar */}
                {showAI && <NotesAISidebar note={selectedNote} onClose={() => setShowAI(false)} />}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Card className="p-8 text-center max-w-sm">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h2 className="text-xl font-semibold mb-2">Select a Note</h2>
                <p className="text-muted-foreground mb-4">
                  Choose a note from the sidebar or create a new one to get started.
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
