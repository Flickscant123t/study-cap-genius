CREATE TABLE IF NOT EXISTS public.enterprise_coach_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.enterprise_coach_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enterprise users can view their own coach questions"
ON public.enterprise_coach_questions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Enterprise users can create their own coach questions"
ON public.enterprise_coach_questions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enterprise users can update their own coach questions"
ON public.enterprise_coach_questions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_enterprise_coach_questions_updated_at
BEFORE UPDATE ON public.enterprise_coach_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
