import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { StudyPlanView } from "@/components/study/StudyPlanView";
import { PremiumLockedView } from "@/components/premium/PremiumLockedView";
import { Loader2 } from "lucide-react";

export default function StudyPlanner() {
  const navigate = useNavigate();
  const { user, isPremium, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <AppLayout title="Study Planner">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Show premium locked view for non-premium users
  if (!isPremium) {
    return (
      <AppLayout title="Study Planner">
        <PremiumLockedView 
          title="Unlock AI Study Planner"
          description="Get personalized multi-day study plans with AI tutoring and mastery verification."
          featureName="Study Planner"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Study Planner">
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">AI Study Planner</h1>
          <p className="text-muted-foreground">
            Enter a learning goal and let AI create a personalized study plan with interactive tutoring
          </p>
        </div>
        <StudyPlanView />
      </div>
    </AppLayout>
  );
}
