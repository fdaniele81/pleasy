-- Add task_order column to project table
-- When set, tasks are displayed in this order instead of by task_number
ALTER TABLE project ADD COLUMN IF NOT EXISTS task_order UUID[] DEFAULT NULL;
