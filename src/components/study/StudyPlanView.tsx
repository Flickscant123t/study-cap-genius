import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  List,
  Plus,
  Play,
  Check,
  Clock,
  Brain,
  Target,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudyPlan, StudyPlan, StudyTask } from "@/hooks/useStudyPlan";
import { TutorOverlay } from "./TutorOverlay";

export function StudyPlanView() {
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState(7);
  const [generating, setGenerating] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<StudyTask | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");

  const { plans, tasks, loading, generatePlan, replan, updateTaskStatus, deletePlan, getTodaysTasks, getTasksForDay } =
    useStudyPlan();

  const handleGeneratePlan = async () => {
    if (!goal.trim()) return;
    setGenerating(true);
    const plan = await generatePlan(goal, duration);
    if (plan) {
      setSelectedPlan(plan.id);
      setGoal("");
    }
    setGenerating(false);
  };

  const handleTaskComplete = async (masteryVerified: boolean) => {
    if (activeTask) {
      await updateTaskStatus(activeTask.id, "completed", masteryVerified);
      setActiveTask(null);
    }
  };

  const handleStruggling = async () => {
    if (selectedPlan) {
      await replan(selectedPlan);
      setActiveTask(null);
    }
  };

  const currentPlan = plans.find((p) => p.id === selectedPlan);
  const planTasks = tasks.filter((t) => t.plan_id === selectedPlan);
  const todaysTasks = selectedPlan ? getTodaysTasks(selectedPlan) : [];

  const completedCount = planTasks.filter((t) => t.status === "completed").length;
  const progressPercent = planTasks.length > 0 ? (completedCount / planTasks.length) * 100 : 0;

  const taskTypeIcons: Record<string, typeof Brain> = {
    active_recall: Brain,
    practice: Target,
    review: RefreshCw,
    spaced_review: Clock,
    deep_study: Sparkles,
    study: Brain,
  };

  const taskTypeColors: Record<string, string> = {
    active_recall: "bg-purple-500/10 text-purple-500",
    practice: "bg-orange-500/10 text-orange-500",
    review: "bg-blue-500/10 text-blue-500",
    spaced_review: "bg-green-500/10 text-green-500",
    deep_study: "bg-pink-500/10 text-pink-500",
    study: "bg-primary/10 text-primary",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create new plan */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Create Study Plan
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Enter your goal (e.g., 'Master Organic Chemistry in 7 days')"
            className="flex-1"
          />
          <div className="flex items-center gap-2">
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
            >
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <Button variant="hero" onClick={handleGeneratePlan} disabled={generating || !goal.trim()}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Generate Plan
            </Button>
          </div>
        </div>
      </Card>

      {/* Plans list */}
      {plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const planTasksCount = tasks.filter((t) => t.plan_id === plan.id).length;
            const planCompletedCount = tasks.filter((t) => t.plan_id === plan.id && t.status === "completed").length;
            const planProgress = planTasksCount > 0 ? (planCompletedCount / planTasksCount) * 100 : 0;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md",
                  selectedPlan === plan.id && "border-primary bg-primary/5"
                )}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{plan.goal}</h4>
                    <p className="text-xs text-muted-foreground">{plan.duration_days} day plan</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlan(plan.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <Progress value={planProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {planCompletedCount}/{planTasksCount} tasks completed
                </p>
              </Card>
            );
          })}
        </div>
      )}

      {/* Selected plan details */}
      {currentPlan && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">{currentPlan.goal}</h2>
              <p className="text-muted-foreground">
                {completedCount}/{planTasks.length} tasks completed • {Math.round(progressPercent)}% complete
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => replan(currentPlan.id)}>
                <RefreshCw className="w-4 h-4" />
                Adjust Plan
              </Button>
              <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
                <TabsList>
                  <TabsTrigger value="list">
                    <List className="w-4 h-4" />
                  </TabsTrigger>
                  <TabsTrigger value="calendar">
                    <Calendar className="w-4 h-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Progress value={progressPercent} className="h-3 mb-6" />

          {/* Today's Focus */}
          {todaysTasks.length > 0 && (
            <div className="mb-6 p-4 bg-accent/10 rounded-xl border border-accent/20">
              <h3 className="font-semibold text-accent mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Today's Focus
              </h3>
              <div className="space-y-2">
                {todaysTasks.map((task) => {
                  const Icon = taskTypeIcons[task.task_type] || Brain;
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg bg-background",
                        task.status === "completed" && "opacity-50"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", taskTypeColors[task.task_type])}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className={cn("font-medium", task.status === "completed" && "line-through")}>{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.time_estimate_minutes} min</p>
                      </div>
                      {task.status !== "completed" ? (
                        <Button variant="hero" size="sm" onClick={() => setActiveTask(task)}>
                          <Play className="w-3 h-3 mr-1" />
                          Start
                        </Button>
                      ) : (
                        <Check className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Task list by day */}
          <Tabs defaultValue="list">
            <TabsContent value="list" className="space-y-4">
              {Array.from({ length: currentPlan.duration_days }, (_, i) => i + 1).map((day) => {
                const dayTasks = getTasksForDay(currentPlan.id, day);
                if (dayTasks.length === 0) return null;

                return (
                  <div key={day} className="border border-border rounded-xl p-4">
                    <h4 className="font-semibold mb-3">Day {day}</h4>
                    <div className="space-y-2">
                      {dayTasks.map((task) => {
                        const Icon = taskTypeIcons[task.task_type] || Brain;
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg bg-secondary/30",
                              task.status === "completed" && "opacity-50"
                            )}
                          >
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", taskTypeColors[task.task_type])}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("font-medium truncate", task.status === "completed" && "line-through")}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {task.time_estimate_minutes} min
                                <span className={cn("px-2 py-0.5 rounded-full", taskTypeColors[task.task_type])}>
                                  {task.task_type.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                            {task.status !== "completed" ? (
                              <Button variant="outline" size="sm" onClick={() => setActiveTask(task)}>
                                <Play className="w-3 h-3" />
                              </Button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Check className="w-4 h-4 text-green-500" />
                                {task.mastery_verified && <Sparkles className="w-3 h-3 text-accent" />}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Empty state */}
      {plans.length === 0 && (
        <Card className="p-16 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No Study Plans Yet</h2>
          <p className="text-muted-foreground mb-4">
            Create a study plan to get AI-generated tasks and track your progress.
          </p>
        </Card>
      )}

      {/* Tutor Overlay */}
      {activeTask && (
        <TutorOverlay
          task={activeTask}
          onComplete={handleTaskComplete}
          onStruggling={handleStruggling}
          onClose={() => setActiveTask(null)}
        />
      )}
    </div>
  );
}
