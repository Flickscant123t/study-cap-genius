import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks, Task } from "@/hooks/useTasks";
import { useNotes } from "@/hooks/useNotes";
import { useFlashcards } from "@/hooks/useFlashcards";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Plus, 
  Loader2,
  CheckSquare,
  Trash2,
  Calendar,
  Flag,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Tasks() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newNoteId, setNewNoteId] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState("");

  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const { notes } = useNotes();
  const { flashcards } = useFlashcards();

  useEffect(() => {
    if (!user) navigate('/auth');
    if (!isPremium) navigate('/tasks');
  }, [user, isPremium, navigate]);

  if (!isPremium) return null;

  // Calculate mastery scores by subject/note
  const getMasteryByNote = (noteId: string) => {
    const noteCards = flashcards.filter(c => c.note_id === noteId);
    if (noteCards.length === 0) return null;
    
    const avgEase = noteCards.reduce((sum, c) => sum + Number(c.ease_factor), 0) / noteCards.length;
    const avgReps = noteCards.reduce((sum, c) => sum + c.repetitions, 0) / noteCards.length;
    return Math.min(100, Math.round(((avgEase - 1.3) / 1.7) * 50 + Math.min(avgReps * 10, 50)));
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) return;
    await createTask(newTitle, newDescription, newNoteId, newPriority, newDueDate || undefined);
    setNewTitle("");
    setNewDescription("");
    setNewPriority('medium');
    setNewNoteId(null);
    setNewDueDate("");
    setShowCreateForm(false);
  };

  const handleToggleComplete = async (task: Task) => {
    await updateTask(task.id, { completed: !task.completed });
  };

  const priorityColors = {
    low: 'text-green-500 bg-green-500/10',
    medium: 'text-yellow-500 bg-yellow-500/10',
    high: 'text-red-500 bg-red-500/10',
  };

  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);

  return (
    <AppLayout title="Tasks">
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Track your study progress and assignments</p>
          </div>
          <Button variant="hero" onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedTasks.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Flag className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tasks.filter(t => t.priority === 'high' && !t.completed).length}
                </p>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="p-6 mb-6">
            <h3 className="font-semibold mb-4">Create New Task</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title..."
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Add details..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Due Date (Optional)</label>
                <Input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Link to Note (Optional)</label>
                <select
                  value={newNoteId || ""}
                  onChange={(e) => setNewNoteId(e.target.value || null)}
                  className="mt-1 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">No link</option>
                  {notes.map(note => (
                    <option key={note.id} value={note.id}>{note.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleCreateTask}>
                Create Task
              </Button>
            </div>
          </Card>
        )}

        {/* Tasks List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <Card className="p-16 text-center">
            <CheckSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Tasks Yet</h2>
            <p className="text-muted-foreground mb-4">
              Create tasks to track your study goals and assignments.
            </p>
            <Button variant="hero" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Pending ({pendingTasks.length})</h3>
                <div className="space-y-2">
                  {pendingTasks.map(task => {
                    const linkedNote = notes.find(n => n.id === task.note_id);
                    const mastery = task.note_id ? getMasteryByNote(task.note_id) : null;
                    
                    return (
                      <Card key={task.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleComplete(task)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">{task.title}</p>
                              <span className={cn("text-xs px-2 py-0.5 rounded-full", priorityColors[task.priority])}>
                                {task.priority}
                              </span>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                              {linkedNote && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {linkedNote.title}
                                </span>
                              )}
                            </div>
                            {mastery !== null && (
                              <div className="mt-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-muted-foreground">Mastery Score</span>
                                  <span className="font-medium">{mastery}%</span>
                                </div>
                                <Progress value={mastery} className="h-2" />
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-muted-foreground">Completed ({completedTasks.length})</h3>
                <div className="space-y-2">
                  {completedTasks.map(task => (
                    <Card key={task.id} className="p-4 opacity-60">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleComplete(task)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="font-medium line-through">{task.title}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
