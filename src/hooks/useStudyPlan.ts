import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface StudyPlan {
  id: string;
  goal: string;
  duration_days: number;
  created_at: string;
}

export interface StudyTask {
  id: string;
  plan_id: string;
  title: string;
  description: string | null;
  task_type: string;
  day_number: number;
  time_estimate_minutes: number;
  status: string;
  completed_at: string | null;
  mastery_verified: boolean;
}

export function useStudyPlan() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPlans = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    const { data: plansData, error: plansError } = await supabase
      .from("study_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (plansError) {
      console.error("Error fetching plans:", plansError);
    } else {
      setPlans((plansData || []) as StudyPlan[]);
    }

    const { data: tasksData, error: tasksError } = await supabase
      .from("study_tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("day_number", { ascending: true });

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
    } else {
      setTasks((tasksData || []) as StudyTask[]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const generatePlan = async (goal: string, durationDays: number = 7) => {
    if (!user) return null;

    // Get weak points from localStorage
    const weakPoints = JSON.parse(localStorage.getItem("studycap_weak_points") || "[]");

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "generate_plan",
          goal,
          durationDays,
          weakPoints,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate plan");
      }

      const data = await response.json();

      // Save plan to database
      const { data: planData, error: planError } = await supabase
        .from("study_plans")
        .insert({
          user_id: user.id,
          goal,
          duration_days: durationDays,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Save tasks
      const tasksToInsert = data.tasks.map((task: any) => ({
        user_id: user.id,
        plan_id: planData.id,
        title: task.title,
        description: task.description,
        task_type: task.type,
        day_number: task.day,
        time_estimate_minutes: task.timeMinutes || 30,
        status: "pending",
      }));

      const { error: tasksError } = await supabase.from("study_tasks").insert(tasksToInsert);

      if (tasksError) throw tasksError;

      await fetchPlans();
      toast({ title: "Study plan created!", description: `${data.tasks.length} tasks generated` });

      return planData;
    } catch (error) {
      console.error("Error generating plan:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate plan",
      });
      return null;
    }
  };

  const replan = async (planId: string) => {
    if (!user) return;

    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const weakPoints = JSON.parse(localStorage.getItem("studycap_weak_points") || "[]");
    const remainingDays = Math.max(
      1,
      plan.duration_days -
        Math.floor((Date.now() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24))
    );

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          type: "replan",
          goal: plan.goal,
          durationDays: remainingDays,
          weakPoints,
        }),
      });

      if (!response.ok) throw new Error("Failed to replan");

      const data = await response.json();

      // Delete old pending tasks
      await supabase.from("study_tasks").delete().eq("plan_id", planId).eq("status", "pending");

      // Insert new tasks
      const tasksToInsert = data.tasks.map((task: any) => ({
        user_id: user.id,
        plan_id: planId,
        title: task.title,
        description: task.description,
        task_type: task.type,
        day_number: task.day,
        time_estimate_minutes: task.timeMinutes || 30,
        status: "pending",
      }));

      await supabase.from("study_tasks").insert(tasksToInsert);
      await fetchPlans();

      toast({ title: "Plan adjusted!", description: "Your study plan has been recalculated" });
    } catch (error) {
      console.error("Error replanning:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to adjust plan" });
    }
  };

  const updateTaskStatus = async (taskId: string, status: string, masteryVerified: boolean = false) => {
    const { error } = await supabase
      .from("study_tasks")
      .update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
        mastery_verified: masteryVerified,
      })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status, completed_at: status === "completed" ? new Date().toISOString() : null, mastery_verified: masteryVerified }
            : t
        )
      );
    }
  };

  const deletePlan = async (planId: string) => {
    const { error } = await supabase.from("study_plans").delete().eq("id", planId);
    if (!error) {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      setTasks((prev) => prev.filter((t) => t.plan_id !== planId));
    }
  };

  const getTasksForDay = (planId: string, dayNumber: number) => {
    return tasks.filter((t) => t.plan_id === planId && t.day_number === dayNumber);
  };

  const getTodaysTasks = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return [];

    const daysSinceStart = Math.floor(
      (Date.now() - new Date(plan.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentDay = Math.min(daysSinceStart + 1, plan.duration_days);

    return tasks.filter((t) => t.plan_id === planId && t.day_number === currentDay);
  };

  return {
    plans,
    tasks,
    loading,
    generatePlan,
    replan,
    updateTaskStatus,
    deletePlan,
    getTasksForDay,
    getTodaysTasks,
    refetch: fetchPlans,
  };
}
