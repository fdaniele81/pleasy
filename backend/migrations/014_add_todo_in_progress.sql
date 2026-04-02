-- Add is_in_progress flag to todo_item
ALTER TABLE public.todo_item
  ADD COLUMN IF NOT EXISTS is_in_progress BOOLEAN NOT NULL DEFAULT FALSE;

-- Add is_in_progress flag to task_timesheet
ALTER TABLE public.task_timesheet
  ADD COLUMN IF NOT EXISTS is_in_progress BOOLEAN NOT NULL DEFAULT FALSE;
