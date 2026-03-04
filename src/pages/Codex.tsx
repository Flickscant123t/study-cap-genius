import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AlertTriangle, Lightbulb, CheckCircle2 } from "lucide-react";
import { BrandIcon } from "@/components/BrandIcon";

type Module = {
  id: string;
  title: string;
  summary: string;
  keyPoint: string;
  examTip: string;
  warning: string;
  checkQuestion: string;
  checkAnswer: string;
};

const modules: Module[] = [
  {
    id: "active-recall",
    title: "Active Recall",
    summary: "Active recall improves retention by forcing retrieval, not re-reading.",
    keyPoint: "You learn more from testing yourself than from passively reviewing notes.",
    examTip: "Convert every paragraph into one short question before moving on.",
    warning: "Do not move to the next topic until you can answer your recall question unaided.",
    checkQuestion: "Why is retrieval practice stronger than highlighting?",
    checkAnswer: "Because retrieval strengthens memory pathways and exposes real gaps.",
  },
  {
    id: "spaced-repetition",
    title: "Spaced Repetition",
    summary: "Spaced practice schedules reviews before forgetting happens.",
    keyPoint: "Intervals should expand as confidence grows.",
    examTip: "Review difficult cards daily, stable cards every 3-7 days.",
    warning: "Cramming creates short-term familiarity, not durable memory.",
    checkQuestion: "What happens if all reviews happen on one day?",
    checkAnswer: "Retention drops quickly because spacing effect is lost.",
  },
  {
    id: "exam-application",
    title: "Exam Application",
    summary: "Transfer knowledge to exam-style tasks under realistic constraints.",
    keyPoint: "Practice in exam format (timed, mixed topics, no notes).",
    examTip: "Use a 45-minute mixed set, then spend 20 minutes in error analysis.",
    warning: "Avoid judging progress by time spent; track solved question quality.",
    checkQuestion: "What metric is better than hours studied?",
    checkAnswer: "Accuracy under timed, mixed-condition practice with error correction.",
  },
];

function Callout({
  type,
  children,
}: {
  type: "warning" | "concept" | "exam";
  children: React.ReactNode;
}) {
  const map = {
    warning: {
      icon: AlertTriangle,
      title: "Warning",
      className: "border-l-4 border-destructive bg-card/80",
    },
    concept: {
      icon: Lightbulb,
      title: "Key Concept",
      className: "border-l-4 border-primary bg-card/80",
    },
    exam: {
      icon: BrandIcon,
      title: "Exam Tip",
      className: "border-l-4 border-accent bg-card/80",
    },
  } as const;

  const cfg = map[type];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-lg p-4 ${cfg.className}`}>
      <p className="flex items-center gap-2 text-sm font-semibold mb-1">
        <Icon className="w-4 h-4" />
        {cfg.title}
      </p>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

export default function CodexPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [showAnswer, setShowAnswer] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const masteredCount = useMemo(
    () => modules.filter((m) => completed[m.id]).length,
    [completed],
  );
  const progress = (masteredCount / modules.length) * 100;

  return (
    <AppLayout title="Codex">
      <div className="flex-1 px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Study AI Codex</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-6">
            <div className="space-y-6">
              <Card className="p-6">
                <h1 className="codex-h1 text-foreground">Study AI Codex</h1>
                <p className="codex-subtitle mt-2">
                  High-efficiency learning framework with scannable modules, recall checkpoints,
                  and mastery tracking.
                </p>
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="codex-h3">Module Mastery</h2>
                    <span className="text-sm text-muted-foreground">
                      {masteredCount}/{modules.length} completed
                    </span>
                  </div>
                  <Progress value={progress} />
                </div>
              </Card>

              {modules.map((module, index) => (
                <section id={module.id} key={module.id} className="scroll-mt-20">
                  <Card className="p-6 space-y-4">
                    <h2 className="codex-h2">
                      {index + 1}. {module.title}
                    </h2>
                    <p className="codex-body">{module.summary}</p>

                    <Callout type="concept">{module.keyPoint}</Callout>
                    <Callout type="exam">{module.examTip}</Callout>
                    <Callout type="warning">{module.warning}</Callout>

                    <div className="rounded-lg border border-border p-4 bg-card/70">
                      <h3 className="codex-h4">Knowledge Check</h3>
                      <p className="text-sm mt-1">{module.checkQuestion}</p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() =>
                            setShowAnswer((prev) => ({ ...prev, [module.id]: !prev[module.id] }))
                          }
                        >
                          {showAnswer[module.id] ? "Hide answer" : "Reveal answer"}
                        </Button>
                        <Button
                          size="sm"
                          variant={completed[module.id] ? "secondary" : "outline"}
                          onClick={() =>
                            setCompleted((prev) => ({ ...prev, [module.id]: !prev[module.id] }))
                          }
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {completed[module.id] ? "Mastered" : "Mark mastered"}
                        </Button>
                      </div>
                      {showAnswer[module.id] && (
                        <p className="text-sm text-muted-foreground mt-3">{module.checkAnswer}</p>
                      )}
                    </div>
                  </Card>
                </section>
              ))}

              <Card className="p-6">
                <h2 className="codex-h2">Responsive Data & Code</h2>
                <p className="codex-body mb-3">
                  Tables and code use horizontal scrolling on small screens to preserve structure.
                </p>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left p-3">Method</th>
                        <th className="text-left p-3">When to Use</th>
                        <th className="text-left p-3">Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="p-3">Active Recall</td>
                        <td className="p-3">After first-pass reading</td>
                        <td className="p-3">Long-term retention</td>
                      </tr>
                      <tr className="border-t">
                        <td className="p-3">Spaced Repetition</td>
                        <td className="p-3">Across days/weeks</td>
                        <td className="p-3">Reduced forgetting</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="overflow-x-auto rounded-md border mt-4">
                  <pre className="p-4 text-xs min-w-[560px]">
{`// 2-1-0 review pattern
const schedule = (confidence: number) =>
  confidence < 0.6 ? [1, 2, 4] : [2, 5, 10];`}
                  </pre>
                </div>
              </Card>
            </div>

            <aside className="hidden xl:block">
              <Card className="p-4 sticky top-6">
                <h3 className="codex-h4 mb-2">Quick Navigation</h3>
                <nav className="space-y-1">
                  {modules.map((module) => (
                    <a
                      key={module.id}
                      href={`#${module.id}`}
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {module.title}
                    </a>
                  ))}
                </nav>
              </Card>
            </aside>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
