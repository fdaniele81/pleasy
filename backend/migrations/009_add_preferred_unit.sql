ALTER TABLE public.users
  ADD COLUMN preferred_unit character varying(10) DEFAULT 'HOURS' NOT NULL;

ALTER TABLE public.users
  ADD CONSTRAINT chk_preferred_unit CHECK (preferred_unit IN ('HOURS', 'DAYS'));
