-- Migration 010: Add default_phases_config column to users table
-- Stores PM-level default project phases configuration (JSONB)
-- When NULL, the system falls back to DEFAULT_PROJECT_PHASES_CONFIG

ALTER TABLE public.users
  ADD COLUMN default_phases_config jsonb DEFAULT NULL;
