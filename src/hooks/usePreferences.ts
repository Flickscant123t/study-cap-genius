import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type StudyPersona = 'coach' | 'scholar' | 'mentor' | 'tutor';
export type Theme = 'light' | 'dark' | 'high-contrast' | 'system';

export interface UserPreferences {
  id: string;
  study_persona: StudyPersona;
  theme: Theme;
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPreferences = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch preferences' });
    } else if (data) {
      setPreferences(data as UserPreferences);
    } else {
      // Create default preferences
      const { data: newData, error: createError } = await supabase
        .from('user_preferences')
        .insert({ user_id: user.id })
        .select()
        .single();

      if (!createError && newData) {
        setPreferences(newData as UserPreferences);
      }
    }
    setLoading(false);
  }, [user, toast]);

  const updatePreferences = async (updates: Partial<Pick<UserPreferences, 'study_persona' | 'theme'>>) => {
    if (!user || !preferences) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update preferences' });
      return null;
    }

    setPreferences(data as UserPreferences);
    return data as UserPreferences;
  };

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  // Apply theme
  useEffect(() => {
    if (!preferences) return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'high-contrast');

    if (preferences.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(preferences.theme);
    }
  }, [preferences?.theme]);

  return { preferences, loading, updatePreferences, refetch: fetchPreferences };
}
