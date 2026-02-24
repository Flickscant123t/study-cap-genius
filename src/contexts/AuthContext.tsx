import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null; needsEmailVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isPremium: boolean;
  dailyUsage: number;
  maxFreeUsage: number;
  incrementUsage: () => void;
  resetUsage: () => void;
  refreshPremiumStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MAX_FREE_USAGE = 15;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [dailyUsage, setDailyUsage] = useState(0);

  // Function to check premium status from database
  const checkPremiumStatus = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking premium status:', error);
        return false;
      }

      let isPremiumUser = data?.status === 'active' && data?.plan === 'premium';

      // Safety net: if webhook missed, try syncing directly from Stripe once.
      if (!isPremiumUser) {
        const { data: syncData, error: syncError } = await supabase.functions.invoke(
          'stripe-sync-subscription',
          { body: {} }
        );

        if (syncError) {
          console.error('Error syncing premium status from Stripe:', syncError);
        } else {
          isPremiumUser = Boolean((syncData as { premium?: boolean } | null)?.premium);
        }
      }

      setIsPremium(isPremiumUser);
      
      // Also update localStorage for quick access
      localStorage.setItem('studycap_premium', isPremiumUser ? 'true' : 'false');
      
      return isPremiumUser;
    } catch (err) {
      console.error('Error in checkPremiumStatus:', err);
      return false;
    }
  }, []);

  // Function to manually refresh premium status
  const refreshPremiumStatus = useCallback(async () => {
    if (user?.id) {
      await checkPremiumStatus(user.id);
    }
  }, [user?.id, checkPremiumStatus]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check premium status when user logs in
        if (session?.user?.id) {
          setTimeout(() => {
            checkPremiumStatus(session.user.id);
          }, 0);
        } else {
          setIsPremium(false);
          localStorage.setItem('studycap_premium', 'false');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check premium status on initial load
      if (session?.user?.id) {
        checkPremiumStatus(session.user.id);
      }
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

    return () => subscription.unsubscribe();
  }, [checkPremiumStatus]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    const needsEmailVerification = !error && !data.session;
    return { error, needsEmailVerification };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async (redirectTo?: string) => {
    const callbackUrl = redirectTo ?? `${window.location.origin}/auth`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });

    return { error };
  };

  const resendVerificationEmail = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsPremium(false);
    localStorage.setItem('studycap_premium', 'false');
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
      signInWithGoogle,
      resendVerificationEmail,
      signOut,
      isPremium,
      dailyUsage,
      maxFreeUsage: MAX_FREE_USAGE,
      incrementUsage,
      resetUsage,
      refreshPremiumStatus,
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
