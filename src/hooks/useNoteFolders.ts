import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface NoteFolder {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export function useNoteFolders() {
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFolders = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('note_folders')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching folders:', error);
    } else {
      setFolders((data || []) as NoteFolder[]);
    }
    setLoading(false);
  };

  const createFolder = async (name: string, parentId: string | null = null) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('note_folders')
      .insert({ user_id: user.id, name, parent_id: parentId })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create folder' });
      return null;
    }

    setFolders(prev => [...prev, data as NoteFolder]);
    return data as NoteFolder;
  };

  const updateFolder = async (id: string, updates: Partial<Pick<NoteFolder, 'name' | 'parent_id' | 'icon' | 'color'>>) => {
    const { data, error } = await supabase
      .from('note_folders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update folder' });
      return null;
    }

    setFolders(prev => prev.map(f => f.id === id ? data as NoteFolder : f));
    return data as NoteFolder;
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase
      .from('note_folders')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete folder' });
      return false;
    }

    setFolders(prev => prev.filter(f => f.id !== id));
    return true;
  };

  const getFolderTree = (parentId: string | null = null): NoteFolder[] => {
    return folders.filter(f => f.parent_id === parentId);
  };

  useEffect(() => {
    fetchFolders();
  }, [user]);

  return { folders, loading, createFolder, updateFolder, deleteFolder, getFolderTree, refetch: fetchFolders };
}
