import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface StudyBlock {
  id: string;
  title: string;
  subject: string | null;
  start_time: string;
  end_time: string;
  color: string;
  task_id: string | null;
  study_plan_id: string | null;
  is_ai_generated: boolean;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useStudyBlocks() {
  const [blocks, setBlocks] = useState<StudyBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBlocks = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('study_blocks')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching study blocks:', error);
    } else {
      setBlocks((data || []) as StudyBlock[]);
    }
    setLoading(false);
  };

  const createBlock = async (block: Omit<StudyBlock, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('study_blocks')
      .insert({ ...block, user_id: user.id })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create study block' });
      return null;
    }

    setBlocks(prev => [...prev, data as StudyBlock]);
    return data as StudyBlock;
  };

  const updateBlock = async (id: string, updates: Partial<Omit<StudyBlock, 'id' | 'created_at' | 'updated_at'>>) => {
    const { data, error } = await supabase
      .from('study_blocks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update study block' });
      return null;
    }

    setBlocks(prev => prev.map(b => b.id === id ? data as StudyBlock : b));
    return data as StudyBlock;
  };

  const deleteBlock = async (id: string) => {
    const { error } = await supabase
      .from('study_blocks')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete study block' });
      return false;
    }

    setBlocks(prev => prev.filter(b => b.id !== id));
    return true;
  };

  const getBlocksForDate = (date: Date): StudyBlock[] => {
    const dateStr = date.toISOString().split('T')[0];
    return blocks.filter(b => b.start_time.startsWith(dateStr));
  };

  const getBlocksForWeek = (startDate: Date): StudyBlock[] => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    return blocks.filter(b => {
      const blockDate = new Date(b.start_time);
      return blockDate >= startDate && blockDate < endDate;
    });
  };

  useEffect(() => {
    fetchBlocks();
  }, [user]);

  return { 
    blocks, 
    loading, 
    createBlock, 
    updateBlock, 
    deleteBlock, 
    getBlocksForDate, 
    getBlocksForWeek,
    refetch: fetchBlocks 
  };
}
