-- Create table for AI-generated study plans
CREATE TABLE public.study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  goal TEXT NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for study tasks (atomic tasks within a plan)
CREATE TABLE public.study_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_id UUID REFERENCES public.study_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'study',
  day_number INTEGER NOT NULL DEFAULT 1,
  time_estimate_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  mastery_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add theme column to user_preferences for aura themes
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS aura_theme TEXT DEFAULT 'default';

-- Enable RLS
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_plans
CREATE POLICY "Users can view their own study plans"
ON public.study_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study plans"
ON public.study_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study plans"
ON public.study_plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study plans"
ON public.study_plans FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for study_tasks
CREATE POLICY "Users can view their own study tasks"
ON public.study_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study tasks"
ON public.study_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study tasks"
ON public.study_tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study tasks"
ON public.study_tasks FOR DELETE
USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_study_plans_updated_at
BEFORE UPDATE ON public.study_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_tasks_updated_at
BEFORE UPDATE ON public.study_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();