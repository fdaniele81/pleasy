-- Add saved_filters JSONB column to users table
-- Stores user's saved filter presets for timesheet and planning views
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS saved_filters JSONB DEFAULT '{}';
