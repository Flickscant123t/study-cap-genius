import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type CoachQuestion = {
  id: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
};

export default function Coach() {
  const { user, loading: authLoading, isEnterprise } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [question, setQuestion] = useState("");
  const [items, setItems] = useState<CoachQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadQuestions = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("enterprise_coach_questions")
        .select("id, question, answer, created_at, answered_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems((data ?? []) as CoachQuestion[]);
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to load coach messages" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isEnterprise) loadQuestions();
  }, [user?.id, isEnterprise]);

  const handleSend = async () => {
    if (!user?.id || !question.trim() || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("enterprise_coach_questions").insert({
        user_id: user.id,
        user_email: user.email ?? null,
        question: question.trim(),
      });
      if (error) throw error;
      setQuestion("");
      await loadQuestions();
      toast({ title: "Question sent to your coach" });
    } catch {
      toast({ variant: "destructive", title: "Could not send question" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Coach">
      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-2">Coach</h1>
        <p className="text-muted-foreground mb-6">Personal trainer chat for enterprise users.</p>

        {!isEnterprise ? (
          <Card className="p-6">
            <p className="font-medium">Enterprise-only feature</p>
            <p className="text-sm text-muted-foreground mt-2">
              Upgrade to Enterprise ($30/month) to send direct questions to your personal trainer.
            </p>
          </Card>
        ) : (
          <>
            <Card className="p-4 mb-6">
              <Textarea
                placeholder="Ask your coach anything..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
              />
              <Button className="mt-3" onClick={handleSend} disabled={submitting || !question.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send question"}
              </Button>
            </Card>

            <div className="space-y-4">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                items.map((item) => (
                  <Card className="p-4" key={item.id}>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                    <p className="font-medium mt-2">{item.question}</p>
                    <div className="mt-3 p-3 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Coach reply</p>
                      <p>{item.answer ?? "No reply yet."}</p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
