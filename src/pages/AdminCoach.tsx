import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type AdminQuestion = {
  id: string;
  user_email: string | null;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
};

export default function AdminCoach() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [adminOk, setAdminOk] = useState(false);
  const [items, setItems] = useState<AdminQuestion[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const validPassword = "imd***imd";

  const load = async (pwd: string) => {
    const { data, error } = await supabase.functions.invoke("enterprise-coach-admin", {
      body: { action: "list", password: pwd },
    });
    if (error) throw error;
    const questions = ((data as { questions?: AdminQuestion[] } | null)?.questions ?? []) as AdminQuestion[];
    setItems(questions);
    setDrafts(Object.fromEntries(questions.map((q) => [q.id, q.answer ?? ""])));
  };

  const submitPassword = async () => {
    if (password !== validPassword) {
      toast({ variant: "destructive", title: "Wrong password" });
      return;
    }
    try {
      await load(password);
      setAdminOk(true);
    } catch {
      toast({ variant: "destructive", title: "Failed to open admin inbox" });
    }
  };

  const unanswered = useMemo(() => items.filter((x) => !x.answer).length, [items]);

  const saveAnswer = async (id: string) => {
    const answer = drafts[id]?.trim();
    if (!answer) return;
    setSavingId(id);
    try {
      const { error } = await supabase.functions.invoke("enterprise-coach-admin", {
        body: { action: "answer", password, questionId: id, answer },
      });
      if (error) throw error;
      await load(password);
      toast({ title: "Answer sent" });
    } catch {
      toast({ variant: "destructive", title: "Could not save answer" });
    } finally {
      setSavingId(null);
    }
  };

  if (!adminOk) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-6 w-full max-w-md">
          <h1 className="text-xl font-bold mb-3">Admin Coach Inbox</h1>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          <Button className="mt-3 w-full" onClick={submitPassword}>
            Open inbox
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Admin Coach Inbox</h1>
      <p className="text-muted-foreground mb-6">
        Total: {items.length} questions. Unanswered: {unanswered}.
      </p>
      <div className="space-y-4">
        {items.map((item) => (
          <Card className="p-4" key={item.id}>
            <p className="text-sm text-muted-foreground">
              {item.user_email ?? "unknown user"} • {new Date(item.created_at).toLocaleString()}
            </p>
            <p className="font-medium mt-2">{item.question}</p>
            <Textarea
              className="mt-3"
              rows={4}
              value={drafts[item.id] ?? ""}
              onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
            />
            <Button className="mt-3" onClick={() => saveAnswer(item.id)} disabled={savingId === item.id}>
              {savingId === item.id ? "Saving..." : "Send answer"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
