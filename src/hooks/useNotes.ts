import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Note {
  id: string;
  title: string;
  content: string;
  subject: string | null;
  created_at: string;
  updated_at: string;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotes = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch notes' });
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const createNote = async (title: string, content: string = '', subject: string | null = null) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: user.id, title, content, subject })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create note' });
      return null;
    }

    setNotes(prev => [data, ...prev]);
    return data;
  };

  const updateNote = async (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'subject'>>) => {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update note' });
      return null;
    }

    setNotes(prev => prev.map(n => n.id === id ? data : n));
    return data;
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete note' });
      return false;
    }

    setNotes(prev => prev.filter(n => n.id !== id));
    return true;
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  return { notes, loading, createNote, updateNote, deleteNote, refetch: fetchNotes };
}
