import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences, StudyPersona, Theme } from "@/hooks/usePreferences";
import { AppLayout } from "@/components/layout/AppLayout";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2,
  User,
  Trophy,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Check,
  Sun,
  Moon,
  Monitor,
  Contrast,
  Lock,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export type AuraTheme = 'default' | 'midnight' | 'forest' | 'sunset';

const personas: { id: StudyPersona; name: string; description: string; icon: React.ElementType }[] = [
  { id: 'coach', name: 'The Coach', description: 'Energetic and motivational. Pushes you to achieve your best!', icon: Trophy },
  { id: 'scholar', name: 'The Scholar', description: 'Thoughtful and academic. Provides thorough explanations.', icon: GraduationCap },
  { id: 'mentor', name: 'The Mentor', description: 'Wise and patient. Guides you to discover answers yourself.', icon: Lightbulb },
  { id: 'tutor', name: 'The Tutor', description: 'Friendly and structured. Breaks down complex topics simply.', icon: BookOpen },
];

const themes: { id: Theme; name: string; description: string; icon: React.ElementType }[] = [
  { id: 'light', name: 'Light', description: 'Clean and bright interface', icon: Sun },
  { id: 'dark', name: 'Dark', description: 'Easy on the eyes at night', icon: Moon },
  { id: 'high-contrast', name: 'High Contrast', description: 'Maximum readability', icon: Contrast },
  { id: 'system', name: 'System', description: 'Follow your device settings', icon: Monitor },
];

const auraThemes: { id: AuraTheme; name: string; description: string; colors: string[] }[] = [
  { id: 'default', name: 'Default', description: 'Original purple theme', colors: ['#6366f1', '#8b5cf6', '#a855f7'] },
  { id: 'midnight', name: 'Midnight', description: 'Deep blue with gold accents', colors: ['#1e3a5f', '#3b82f6', '#fbbf24'] },
  { id: 'forest', name: 'Forest', description: 'Dark green with stone tones', colors: ['#14532d', '#22c55e', '#a3a3a3'] },
  { id: 'sunset', name: 'Sunset', description: 'Vivid orange meets deep purple', colors: ['#581c87', '#f97316', '#a855f7'] },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, isPremium, loading: authLoading } = useAuth();
  const { preferences, loading, updatePreferences } = usePreferences();
  const { toast } = useToast();
  const [auraTheme, setAuraTheme] = useState<AuraTheme>('default');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [autoRenewalCanceled, setAutoRenewalCanceled] = useState(false);
  const [renewalPeriodEnd, setRenewalPeriodEnd] = useState<string | null>(null);
  const [loadingRenewalStatus, setLoadingRenewalStatus] = useState(false);
  const [cancelingRenewal, setCancelingRenewal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Load aura theme from localStorage or DB
    const stored = localStorage.getItem('studycap_aura_theme') as AuraTheme | null;
    if (stored && isPremium) {
      setAuraTheme(stored);
      applyAuraTheme(stored);
    }
  }, [isPremium]);

  useEffect(() => {
    const fetchRenewalStatus = async () => {
      if (!user || !isPremium) {
        setAutoRenewalCanceled(false);
        setRenewalPeriodEnd(null);
        return;
      }

      setLoadingRenewalStatus(true);
      try {
        const { data, error } = await supabase.functions.invoke("stripe-renewal", {
          body: { action: "status" },
        });

        if (error) {
          console.error("Failed to fetch renewal status:", error);
          return;
        }

        const payload = data as { cancelAtPeriodEnd?: boolean; currentPeriodEnd?: string | null } | null;
        setAutoRenewalCanceled(Boolean(payload?.cancelAtPeriodEnd));
        setRenewalPeriodEnd(payload?.currentPeriodEnd ?? null);
      } finally {
        setLoadingRenewalStatus(false);
      }
    };

    fetchRenewalStatus();
  }, [user?.id, isPremium]);

  const applyAuraTheme = (theme: AuraTheme) => {
    const root = document.documentElement;
    // Remove all aura theme classes
    root.classList.remove('midnight', 'forest', 'sunset');
    
    // Apply the new aura theme (if not default)
    if (theme !== 'default') {
      root.classList.add(theme);
    }
  };

  const handleAuraThemeChange = async (theme: AuraTheme) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setAuraTheme(theme);
    localStorage.setItem('studycap_aura_theme', theme);
    applyAuraTheme(theme);

    // Also save to DB
    if (user) {
      await supabase
        .from('user_preferences')
        .update({ aura_theme: theme })
        .eq('user_id', user.id);
    }
  };

  const handlePersonaChange = async (persona: StudyPersona) => {
    await updatePreferences?.({ study_persona: persona });
  };

  const handleThemeChange = async (theme: Theme) => {
    await updatePreferences?.({ theme });
  };

  const handleCancelAutoRenewal = async () => {
    setCancelingRenewal(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-renewal", {
        body: { action: "cancel" },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Unable to cancel auto-renewal",
          description: error.message,
        });
        return;
      }

      const payload = data as { cancelAtPeriodEnd?: boolean; currentPeriodEnd?: string | null } | null;
      setAutoRenewalCanceled(Boolean(payload?.cancelAtPeriodEnd));
      setRenewalPeriodEnd(payload?.currentPeriodEnd ?? null);

      const endDateLabel = payload?.currentPeriodEnd
        ? new Date(payload.currentPeriodEnd).toLocaleDateString()
        : null;

      toast({
        title: "Auto-renewal canceled",
        description: endDateLabel
          ? `Premium stays active until ${endDateLabel}.`
          : "Premium stays active until the end of your current billing period.",
      });
    } finally {
      setCancelingRenewal(false);
    }
  };

  if (loading || authLoading) {
    return (
      <AppLayout title="Settings">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const renewalEndDateLabel = renewalPeriodEnd
    ? new Date(renewalPeriodEnd).toLocaleDateString()
    : null;

  return (
    <AppLayout title="Settings">
      <div className="flex-1 p-6 max-w-4xl mx-auto">
        {/* Premium Modal */}
        <PremiumModal
          open={showPremiumModal}
          onOpenChange={setShowPremiumModal}
          featureName="Aura Themes"
          featureDescription="Premium Aura Themes transform your entire app with beautiful color palettes. Upgrade to unlock Midnight, Forest, and Sunset themes."
        />

        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">Customize your learning experience</p>

        {/* Profile Section */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.email}</p>
              {isPremium ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                    <Crown className="w-3 h-3" />
                    Premium Member
                  </span>
                  <div className="mt-3 space-y-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={autoRenewalCanceled ? "secondary" : "destructive"}
                      onClick={handleCancelAutoRenewal}
                      disabled={loadingRenewalStatus || cancelingRenewal || autoRenewalCanceled}
                    >
                      {cancelingRenewal ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Canceling...
                        </>
                      ) : autoRenewalCanceled ? (
                        "Auto-renewal canceled"
                      ) : (
                        "Cancel auto-renewal"
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {autoRenewalCanceled
                        ? renewalEndDateLabel
                          ? `You keep premium access until ${renewalEndDateLabel}.`
                          : "You keep premium access until the end of this billing period."
                        : "Cancel anytime and keep premium until your current billing period ends."}
                    </p>
                  </div>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                  Free Plan
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Aura Themes (Premium) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold">Aura Themes</h2>
            <span className="px-2 py-0.5 rounded-full gradient-accent text-xs font-semibold text-accent-foreground flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Premium
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Transform your entire app with premium color themes
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {auraThemes.map(theme => {
              const isLocked = !isPremium && theme.id !== 'default';
              const isSelected = auraTheme === theme.id;
              
              return (
                <Card
                  key={theme.id}
                  className={cn(
                    "p-4 cursor-pointer transition-all relative",
                    isSelected && isPremium && "border-primary ring-2 ring-primary/20",
                    isLocked && "opacity-50"
                  )}
                  onClick={() => handleAuraThemeChange(theme.id)}
                >
                  {/* Locked Overlay for non-premium */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-background/60 rounded-lg flex items-center justify-center z-10">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex gap-1 mb-3">
                    {theme.colors.map((color, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-lg"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{theme.name}</p>
                    {isSelected && isPremium && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                    {isLocked && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Pro
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* AI Study Persona */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-1">AI Study Persona</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose how NovaAI interacts with you
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {personas.map(persona => (
              <Card
                key={persona.id}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md",
                  preferences?.study_persona === persona.id && "border-primary bg-primary/5"
                )}
                onClick={() => handlePersonaChange(persona.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    preferences?.study_persona === persona.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    <persona.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{persona.name}</p>
                      {preferences?.study_persona === persona.id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{persona.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <h2 className="text-lg font-semibold mb-1">Base Theme</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose light or dark mode (combined with Aura theme)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {themes.map(theme => (
              <Card
                key={theme.id}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md text-center",
                  preferences?.theme === theme.id && "border-primary bg-primary/5"
                )}
                onClick={() => handleThemeChange(theme.id)}
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3",
                  preferences?.theme === theme.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                )}>
                  <theme.icon className="w-6 h-6" />
                </div>
                <p className="font-medium text-sm">{theme.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                {preferences?.theme === theme.id && (
                  <Check className="w-4 h-4 text-primary mx-auto mt-2" />
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
