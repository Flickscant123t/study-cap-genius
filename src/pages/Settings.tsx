import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences, StudyPersona, Theme } from "@/hooks/usePreferences";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Loader2,
  User,
  Palette,
  Trophy,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Check,
  Sun,
  Moon,
  Monitor,
  Contrast,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function Settings() {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const { preferences, loading, updatePreferences } = usePreferences();

  useEffect(() => {
    if (!user) navigate('/auth');
    if (!isPremium) navigate('/settings');
  }, [user, isPremium, navigate]);

  if (!isPremium) return null;

  const handlePersonaChange = async (persona: StudyPersona) => {
    await updatePreferences({ study_persona: persona });
  };

  const handleThemeChange = async (theme: Theme) => {
    await updatePreferences({ theme });
  };

  if (loading) {
    return (
      <AppLayout title="Settings">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Settings">
      <div className="flex-1 p-6 max-w-4xl mx-auto">
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                Premium Member
              </span>
            </div>
          </div>
        </Card>

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
          <h2 className="text-lg font-semibold mb-1">Theme</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Choose your preferred appearance
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
