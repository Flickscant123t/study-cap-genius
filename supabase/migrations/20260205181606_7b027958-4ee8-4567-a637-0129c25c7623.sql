-- Add folder system to notes table
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS folder_path TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS parent_folder_id UUID DEFAULT NULL;

-- Create folders table for nested organization
CREATE TABLE IF NOT EXISTS public.note_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.note_folders(id) ON DELETE CASCADE,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on folders
ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;

-- Folder policies
CREATE POLICY "Users can view their own folders" 
ON public.note_folders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" 
ON public.note_folders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" 
ON public.note_folders FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" 
ON public.note_folders FOR DELETE 
USING (auth.uid() = user_id);

-- Create study_blocks table for calendar
CREATE TABLE IF NOT EXISTS public.study_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  study_plan_id UUID REFERENCES public.study_plans(id) ON DELETE SET NULL,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on study_blocks
ALTER TABLE public.study_blocks ENABLE ROW LEVEL SECURITY;

-- Study blocks policies
CREATE POLICY "Users can view their own study blocks" 
ON public.study_blocks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study blocks" 
ON public.study_blocks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study blocks" 
ON public.study_blocks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study blocks" 
ON public.study_blocks FOR DELETE 
USING (auth.uid() = user_id);

-- Add exam_date to tasks for AI optimization
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS exam_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC(4,2) DEFAULT NULL;

-- Trigger for study_blocks updated_at
CREATE TRIGGER update_study_blocks_updated_at
BEFORE UPDATE ON public.study_blocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for note_folders updated_at
CREATE TRIGGER update_note_folders_updated_at
BEFORE UPDATE ON public.note_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();