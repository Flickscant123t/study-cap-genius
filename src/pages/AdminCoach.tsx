import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";

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
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<AdminQuestion[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Check admin role server-side
  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdmin();
  }, [user]);

  const load = async () => {
    const { data, error } = await supabase.functions.invoke("enterprise-coach-admin", {
      body: { action: "list" },
    });
    if (error) throw error;
    const questions = ((data as { questions?: AdminQuestion[] } | null)?.questions ?? []) as AdminQuestion[];
    setItems(questions);
    setDrafts(Object.fromEntries(questions.map((q) => [q.id, q.answer ?? ""])));
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const unanswered = useMemo(() => items.filter((x) => !x.answer).length, [items]);

  const saveAnswer = async (id: string) => {
    const answer = drafts[id]?.trim();
    if (!answer) return;
    setSavingId(id);
    try {
      const { error } = await supabase.functions.invoke("enterprise-coach-admin", {
        body: { action: "answer", questionId: id, answer },
      });
      if (error) throw error;
      await load();
      toast({ title: "Answer sent" });
    } catch {
      toast({ variant: "destructive", title: "Could not save answer" });
    } finally {
      setSavingId(null);
    }
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
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
