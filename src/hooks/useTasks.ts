import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  note_id: string | null;
  title: string;
  description: string | null;
  completed: boolean;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTasks = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch tasks' });
    } else {
      setTasks((data || []) as Task[]);
    }
    setLoading(false);
  };

  const createTask = async (title: string, description?: string, noteId?: string | null, priority: 'low' | 'medium' | 'high' = 'medium', dueDate?: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title,
        description,
        note_id: noteId || null,
        priority,
        due_date: dueDate || null,
      })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create task' });
      return null;
    }

    setTasks(prev => [data as Task, ...prev]);
    return data as Task;
  };

  const updateTask = async (id: string, updates: Partial<Pick<Task, 'title' | 'description' | 'completed' | 'priority' | 'due_date' | 'note_id'>>) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update task' });
      return null;
    }

    setTasks(prev => prev.map(t => t.id === id ? data as Task : t));
    return data as Task;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete task' });
      return false;
    }

    setTasks(prev => prev.filter(t => t.id !== id));
    return true;
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  return { tasks, loading, createTask, updateTask, deleteTask, refetch: fetchTasks };
}
