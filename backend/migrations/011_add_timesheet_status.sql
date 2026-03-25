-- Migration 011: Add timesheet_status lookup table and timesheet_status_id column to task_timesheet
-- Introduces three states for timesheets: INSERTED, COMPLETED, SUBMITTED

-- 1. Create lookup table
CREATE TABLE IF NOT EXISTS public.timesheet_status (
    timesheet_status_id character varying(50) NOT NULL,
    description character varying(255),
    CONSTRAINT timesheet_status_pkey PRIMARY KEY (timesheet_status_id)
);

-- 2. Seed lookup data
INSERT INTO public.timesheet_status (timesheet_status_id, description) VALUES
  ('INSERTED', 'Inserito'),
  ('COMPLETED', 'Completato'),
  ('SUBMITTED', 'Sottomesso')
ON CONFLICT (timesheet_status_id) DO NOTHING;

-- 3. Add column with default 'INSERTED'
ALTER TABLE public.task_timesheet
  ADD COLUMN timesheet_status_id character varying(50) NOT NULL DEFAULT 'INSERTED';

-- 4. Set existing submitted timesheets (those with a snapshot_id) to 'SUBMITTED'
UPDATE public.task_timesheet
  SET timesheet_status_id = 'SUBMITTED'
  WHERE snapshot_id IS NOT NULL;

-- 5. Add foreign key constraint
ALTER TABLE ONLY public.task_timesheet
  ADD CONSTRAINT fk_timesheet_status FOREIGN KEY (timesheet_status_id)
  REFERENCES public.timesheet_status(timesheet_status_id) ON DELETE RESTRICT;
