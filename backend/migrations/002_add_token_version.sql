-- Add token_version column to users table
-- Used for refresh token invalidation on password change
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0 NOT NULL;
