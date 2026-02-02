import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Flashcard {
  id: string;
  note_id: string | null;
  front: string;
  back: string;
  last_reviewed: string | null;
  next_review: string;
  interval: number;
  ease_factor: number;
  repetitions: number;
  created_at: string;
}

// SM-2 Algorithm implementation
export function calculateSM2(quality: number, repetitions: number, easeFactor: number, interval: number) {
  // quality: 0-5 (0-2 = fail, 3 = hard, 4 = good, 5 = easy)
  let newRepetitions = repetitions;
  let newEaseFactor = easeFactor;
  let newInterval = interval;

  if (quality < 3) {
    // Failed - reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Passed
    if (newRepetitions === 0) {
      newInterval = 1;
    } else if (newRepetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions += 1;
  }

  // Update ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  return { repetitions: newRepetitions, easeFactor: newEaseFactor, interval: newInterval };
}

export function useFlashcards(noteId?: string) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFlashcards = async () => {
    if (!user) return;

    setLoading(true);
    let query = supabase.from('flashcards').select('*');
    
    if (noteId) {
      query = query.eq('note_id', noteId);
    }

    const { data, error } = await query.order('next_review', { ascending: true });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch flashcards' });
    } else {
      setFlashcards(data || []);
    }
    setLoading(false);
  };

  const getDueCards = () => {
    const now = new Date().toISOString();
    return flashcards.filter(card => card.next_review <= now);
  };

  const createFlashcard = async (front: string, back: string, noteId?: string | null) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('flashcards')
      .insert({ 
        user_id: user.id, 
        front, 
        back, 
        note_id: noteId || null 
      })
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create flashcard' });
      return null;
    }

    setFlashcards(prev => [...prev, data]);
    return data;
  };

  const reviewCard = async (id: string, quality: number) => {
    const card = flashcards.find(c => c.id === id);
    if (!card) return null;

    const { repetitions, easeFactor, interval } = calculateSM2(
      quality,
      card.repetitions,
      Number(card.ease_factor),
      card.interval
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const { data, error } = await supabase
      .from('flashcards')
      .update({
        last_reviewed: new Date().toISOString(),
        next_review: nextReview.toISOString(),
        interval,
        ease_factor: easeFactor,
        repetitions,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update flashcard' });
      return null;
    }

    setFlashcards(prev => prev.map(c => c.id === id ? data : c));
    return data;
  };

  const deleteFlashcard = async (id: string) => {
    const { error } = await supabase.from('flashcards').delete().eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete flashcard' });
      return false;
    }

    setFlashcards(prev => prev.filter(c => c.id !== id));
    return true;
  };

  useEffect(() => {
    fetchFlashcards();
  }, [user, noteId]);

  return { flashcards, loading, getDueCards, createFlashcard, reviewCard, deleteFlashcard, refetch: fetchFlashcards };
}
