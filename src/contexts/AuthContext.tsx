import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isPremium: boolean;
  dailyUsage: number;
  maxFreeUsage: number;
  incrementUsage: () => void;
  resetUsage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_FREE_USAGE = 15;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Load usage from localStorage
    const storedUsage = localStorage.getItem('studycap_daily_usage');
    const storedDate = localStorage.getItem('studycap_usage_date');
    const today = new Date().toDateString();
    
    if (storedDate === today && storedUsage) {
      setDailyUsage(parseInt(storedUsage, 10));
    } else {
      localStorage.setItem('studycap_usage_date', today);
      localStorage.setItem('studycap_daily_usage', '0');
      setDailyUsage(0);
    }

    // Check premium status from localStorage (will be updated by Stripe webhook later)
    const premiumStatus = localStorage.getItem('studycap_premium');
    setIsPremium(premiumStatus === 'true');

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const incrementUsage = () => {
    const newUsage = dailyUsage + 1;
    setDailyUsage(newUsage);
    localStorage.setItem('studycap_daily_usage', newUsage.toString());
  };

  const resetUsage = () => {
    setDailyUsage(0);
    localStorage.setItem('studycap_daily_usage', '0');
    localStorage.setItem('studycap_usage_date', new Date().toDateString());
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      isPremium,
      dailyUsage,
      maxFreeUsage: MAX_FREE_USAGE,
      incrementUsage,
      resetUsage,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
