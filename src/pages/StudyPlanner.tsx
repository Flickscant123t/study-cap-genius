import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumLockedView } from "@/components/premium/PremiumLockedView";
import { StudyCalendar } from "@/components/study/StudyCalendar";
import { SubjectProgress } from "@/components/study/SubjectProgress";
import { StudyPlanView } from "@/components/study/StudyPlanView";
import { useStudyBlocks } from "@/hooks/useStudyBlocks";
import { useTasks } from "@/hooks/useTasks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Target,
  Calendar,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  addHours,
  addDays,
  startOfDay,
  setHours,
} from "date-fns";

export default function StudyPlanner() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [optimizing, setOptimizing] = useState(false);
  
  const navigate = useNavigate();
  const { user, isPremium, loading: authLoading } = useAuth();
  const { createBlock } = useStudyBlocks();
  const { tasks } = useTasks();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Show premium locked view for non-premium users
  if (!isPremium && !authLoading) {
    return (
      <AppLayout title="Study Planner">
        <PremiumLockedView
          title="Unlock AI Study Planner"
          description="Get a dynamic calendar with drag-and-drop scheduling, AI optimization, priority heatmaps, and real-time task syncing."
          featureName="Study Planner"
        />
      </AppLayout>
    );
  }

  const handleOptimize = async () => {
    setOptimizing(true);

    try {
      // Get incomplete tasks with due dates
      const incompleteTasks = tasks.filter((t) => !t.completed && t.due_date);
      
      if (incompleteTasks.length === 0) {
        toast({
          title: "No tasks to optimize",
          description: "Add tasks with due dates to use AI optimization.",
        });
        setOptimizing(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            type: "optimize_schedule",
            tasks: incompleteTasks.map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              dueDate: t.due_date,
              estimatedHours: (t as any).estimated_hours || 1,
              subject: (t as any).subject || "General",
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to optimize schedule");
      }

      const data = await response.json();
      
      // Create study blocks from AI recommendations
      if (data.blocks && Array.isArray(data.blocks)) {
        for (const block of data.blocks) {
          const startTime = new Date(block.start_time);
          const endTime = new Date(block.end_time);
          
          await createBlock({
            title: block.title,
            subject: block.subject || null,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            color: block.color || "#8b5cf6",
            task_id: block.task_id || null,
            study_plan_id: null,
            is_ai_generated: true,
            completed: false,
          });
        }

        toast({
          title: "Schedule optimized!",
          description: `Created ${data.blocks.length} study blocks based on your tasks and deadlines.`,
        });
      }
    } catch (error) {
      console.error("Error optimizing schedule:", error);
      toast({
        variant: "destructive",
        title: "Optimization failed",
        description: "Could not optimize your schedule. Please try again.",
      });
    } finally {
      setOptimizing(false);
    }
  };

  if (authLoading) {
    return (
      <AppLayout title="Study Planner">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Study Planner">
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Study Planner</h1>
              <p className="text-muted-foreground">
                Plan, schedule, and optimize your study sessions
              </p>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="plans" className="gap-2">
                <Target className="w-4 h-4" />
                Study Plans
              </TabsTrigger>
              <TabsTrigger value="progress" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-6">
              <StudyCalendar onOptimize={handleOptimize} optimizing={optimizing} />
            </TabsContent>

            <TabsContent value="plans" className="mt-6">
              <StudyPlanView />
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SubjectProgress />
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Study Statistics</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-xl text-center">
                      <p className="text-3xl font-bold text-primary">0h</p>
                      <p className="text-sm text-muted-foreground">This Week</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl text-center">
                      <p className="text-3xl font-bold text-primary">0</p>
                      <p className="text-sm text-muted-foreground">Sessions</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl text-center">
                      <p className="text-3xl font-bold text-primary">0</p>
                      <p className="text-sm text-muted-foreground">Tasks Done</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl text-center">
                      <p className="text-3xl font-bold text-primary">0%</p>
                      <p className="text-sm text-muted-foreground">Mastery</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
