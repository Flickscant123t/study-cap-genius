import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTasks, Task } from "@/hooks/useTasks";
import { useStudyBlocks } from "@/hooks/useStudyBlocks";
import { BookOpen, Target, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Extend Task type to include new fields from migration
interface ExtendedTask extends Task {
  subject?: string | null;
  exam_date?: string | null;
  estimated_hours?: number | null;
}
import { differenceInMinutes, parseISO } from "date-fns";

export function SubjectProgress() {
  const { tasks } = useTasks();
  const { blocks } = useStudyBlocks();

  const subjectStats = useMemo(() => {
    const stats: Record<
      string,
      {
        total: number;
        completed: number;
        hoursStudied: number;
        upcomingExam: Date | null;
      }
    > = {};

    // Aggregate task data
    (tasks as ExtendedTask[]).forEach((task) => {
      const subject = task.subject || "General";
      if (!stats[subject]) {
        stats[subject] = {
          total: 0,
          completed: 0,
          hoursStudied: 0,
          upcomingExam: null,
        };
      }
      stats[subject].total++;
      if (task.completed) stats[subject].completed++;
      if (task.exam_date) {
        const examDate = new Date(task.exam_date);
        if (!stats[subject].upcomingExam || examDate < stats[subject].upcomingExam) {
          stats[subject].upcomingExam = examDate;
        }
      }
    });

    // Aggregate study block hours
    blocks.forEach((block) => {
      const subject = block.subject || "General";
      if (!stats[subject]) {
        stats[subject] = {
          total: 0,
          completed: 0,
          hoursStudied: 0,
          upcomingExam: null,
        };
      }
      if (block.completed) {
        const hours = differenceInMinutes(
          parseISO(block.end_time),
          parseISO(block.start_time)
        ) / 60;
        stats[subject].hoursStudied += hours;
      }
    });

    return Object.entries(stats)
      .map(([subject, data]) => ({
        subject,
        ...data,
        progress: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      }))
      .sort((a, b) => {
        // Sort by upcoming exam date (soonest first)
        if (a.upcomingExam && b.upcomingExam) {
          return a.upcomingExam.getTime() - b.upcomingExam.getTime();
        }
        if (a.upcomingExam) return -1;
        if (b.upcomingExam) return 1;
        return b.progress - a.progress;
      });
  }, [tasks, blocks]);

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getDaysUntilExam = (examDate: Date | null) => {
    if (!examDate) return null;
    const days = Math.ceil(
      (examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  if (subjectStats.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Subject Progress</h3>
        </div>
        <p className="text-muted-foreground text-center py-8">
          Add tasks with subjects to track your progress
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Subject Progress</h3>
      </div>

      <div className="space-y-4">
        {subjectStats.map((stat) => {
          const daysUntil = getDaysUntilExam(stat.upcomingExam);

          return (
            <div key={stat.subject} className="p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{stat.subject}</span>
                </div>
                {daysUntil !== null && (
                  <span
                    className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      daysUntil <= 3
                        ? "bg-red-500/20 text-red-600"
                        : daysUntil <= 7
                        ? "bg-orange-500/20 text-orange-600"
                        : "bg-blue-500/20 text-blue-600"
                    )}
                  >
                    Exam in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <Progress
                value={stat.progress}
                className="h-2 mb-2"
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {stat.completed}/{stat.total} tasks
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {stat.hoursStudied.toFixed(1)}h studied
                  </span>
                </div>
                <span className="font-medium">{Math.round(stat.progress)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
