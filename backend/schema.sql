-- ============================================================================
-- Pleasy - PostgreSQL Database Schema
-- Extracted from production database (PostgreSQL 16)
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE FUNCTION public.get_next_task_number(p_project_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  next_number integer;
BEGIN
  INSERT INTO task_sequence (project_id, last_task_number, created_at, updated_at)
  VALUES (p_project_id, 1, NOW(), NOW())
  ON CONFLICT (project_id)
  DO UPDATE SET
    last_task_number = task_sequence.last_task_number + 1,
    updated_at = NOW()
  RETURNING last_task_number INTO next_number;

  RETURN next_number;
END;
$$;

COMMENT ON FUNCTION public.get_next_task_number(p_project_id uuid)
  IS 'Genera il prossimo numero sequenziale per un progetto. Thread-safe grazie a ON CONFLICT.';


CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- ============================================================================
-- LOOKUP TABLES
-- ============================================================================

CREATE TABLE public.role (
    role_id character varying(50) NOT NULL,
    description character varying(255)
);

CREATE TABLE public.status (
    status_id character varying(50) NOT NULL,
    description character varying(255)
);

CREATE TABLE public.task_status (
    task_status_id character varying(50) NOT NULL,
    description character varying(255)
);

CREATE TABLE public.time_off_type (
    time_off_type_id character varying(50) NOT NULL,
    description character varying(255)
);

CREATE TABLE public.estimate_status (
    estimate_status_id character varying(50) NOT NULL,
    description character varying(255)
);

CREATE TABLE public.project_status (
    project_status_id character varying(50) NOT NULL,
    description character varying(255)
);

CREATE TABLE public.project_type (
    project_type_id character varying(50) NOT NULL,
    description character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.project_type IS 'Types of projects';

-- ============================================================================
-- COMPANY (Multi-tenant)
-- ============================================================================

CREATE TABLE public.company (
    company_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_key character varying(50) NOT NULL,
    legal_name character varying(255),
    vat_number character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status_id character varying
);

COMMENT ON TABLE public.company IS 'Tenant/company master table';

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE public.users (
    user_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255),
    role_id character varying(50),
    status_id character varying(50),
    last_access_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    full_name character varying
);

COMMENT ON TABLE public.users IS 'User accounts associated with companies';

-- ============================================================================
-- CLIENT
-- ============================================================================

CREATE TABLE public.client (
    client_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_id uuid NOT NULL,
    client_key character varying(50) NOT NULL,
    client_name character varying(255),
    client_description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status_id character varying,
    color character varying(7) DEFAULT '#6B7280'::character varying,
    project_phases_config jsonb DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.client IS 'Clients associated with companies';

-- ============================================================================
-- PROJECT
-- ============================================================================

CREATE TABLE public.project (
    project_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    project_key character varying(50) NOT NULL,
    title character varying(255),
    description text,
    status_id character varying(50),
    project_details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    project_type_id character varying(50) DEFAULT 'PROJECT'::character varying NOT NULL,
    reconciliation_required boolean DEFAULT true NOT NULL
);

COMMENT ON TABLE public.project IS 'Projects associated with clients';

-- ============================================================================
-- PROJECT MANAGER (Many-to-Many)
-- ============================================================================

CREATE TABLE public.project_manager (
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TASK SEQUENCE
-- ============================================================================

CREATE TABLE public.task_sequence (
    project_id uuid NOT NULL,
    last_task_number integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.task_sequence IS 'Manages sequential task numbering per project';

-- ============================================================================
-- TASK
-- ============================================================================

CREATE TABLE public.task (
    task_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    task_number integer NOT NULL,
    project_id uuid NOT NULL,
    external_key character varying(100),
    title character varying(255),
    description text,
    task_status_id character varying(50),
    owner_id uuid,
    budget numeric(12,2),
    task_details jsonb,
    start_date date,
    end_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    initial_actual numeric(12,2) DEFAULT 0.00
);

COMMENT ON TABLE public.task IS 'Tasks within projects with sequential numbering';
COMMENT ON COLUMN public.task.initial_actual IS 'Initial actual hours recorded before timesheet tracking (e.g., work done before migration or external hours)';

-- ============================================================================
-- TASK ETC (Estimate To Complete)
-- ============================================================================

CREATE TABLE public.task_etc (
    etc_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    task_id uuid NOT NULL,
    company_id uuid NOT NULL,
    etc_hours numeric(5,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.task_etc IS 'Estimate to Complete for tasks';

-- ============================================================================
-- TIMESHEET SNAPSHOT
-- ============================================================================

CREATE TABLE public.timesheet_snapshot (
    snapshot_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    is_submitted boolean DEFAULT false,
    submitted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TASK TIMESHEET
-- ============================================================================

CREATE TABLE public.task_timesheet (
    timesheet_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    task_id uuid NOT NULL,
    company_id uuid NOT NULL,
    user_id uuid NOT NULL,
    timesheet_date date NOT NULL,
    total_hours numeric(5,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    snapshot_id uuid,
    details text,
    external_key character varying(255)
);

COMMENT ON TABLE public.task_timesheet IS 'Time entries for tasks';

-- ============================================================================
-- HOLIDAY CALENDAR
-- ============================================================================

CREATE TABLE public.holiday_calendar (
    holiday_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    date date NOT NULL,
    is_recurring boolean DEFAULT false,
    company_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.holiday_calendar IS 'Company-specific and global holidays';

-- ============================================================================
-- USER TIME OFF PLAN
-- ============================================================================

CREATE TABLE public.user_time_off_plan (
    time_off_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    company_id uuid NOT NULL,
    time_off_type_id character varying(50) NOT NULL,
    date date NOT NULL,
    hours numeric(5,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    details text
);

COMMENT ON TABLE public.user_time_off_plan IS 'Planned time off for users';

-- ============================================================================
-- ESTIMATE
-- ============================================================================

CREATE TABLE public.estimate (
    estimate_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    client_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    status character varying(50) DEFAULT 'DRAFT'::character varying NOT NULL,
    project_id uuid,
    pct_analysis numeric(5,2) DEFAULT 13.00 NOT NULL,
    pct_development numeric(5,2) DEFAULT 38.00 NOT NULL,
    pct_internal_test numeric(5,2) DEFAULT 5.00 NOT NULL,
    pct_uat numeric(5,2) DEFAULT 13.00 NOT NULL,
    pct_release numeric(5,2) DEFAULT 0.00 NOT NULL,
    pct_pm numeric(5,2) DEFAULT 10.00 NOT NULL,
    pct_startup numeric(5,2) DEFAULT 15.00 NOT NULL,
    pct_documentation numeric(5,2) DEFAULT 6.00 NOT NULL,
    contingency_percentage numeric(5,2) DEFAULT 20.00 NOT NULL,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    converted_at timestamp without time zone,
    estimate_phase_config jsonb DEFAULT '{}'::jsonb,
    project_managers uuid[] DEFAULT '{}'::uuid[]
);

-- ============================================================================
-- ESTIMATE TASK
-- ============================================================================

CREATE TABLE public.estimate_task (
    estimate_task_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    estimate_id uuid NOT NULL,
    activity_name character varying(255) NOT NULL,
    activity_detail text,
    hours_development_input numeric(12,2) NOT NULL,
    hours_analysis numeric(12,2) DEFAULT 0.00,
    hours_development numeric(12,2) DEFAULT 0.00,
    hours_internal_test numeric(12,2) DEFAULT 0.00,
    hours_uat numeric(12,2) DEFAULT 0.00,
    hours_release numeric(12,2) DEFAULT 0.00,
    hours_pm numeric(12,2) DEFAULT 0.00,
    hours_startup numeric(12,2) DEFAULT 0.00,
    hours_documentation numeric(12,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    hours_contingency numeric
);

-- ============================================================================
-- PROJECT DRAFT (from estimates)
-- ============================================================================

CREATE TABLE public.project_draft (
    project_draft_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    estimate_id uuid NOT NULL,
    project_id uuid,
    client_id uuid NOT NULL,
    project_key character varying(50) NOT NULL,
    title character varying(255),
    description text,
    status_id character varying(50),
    project_details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by uuid
);

-- ============================================================================
-- TASK DRAFT
-- ============================================================================

CREATE TABLE public.task_draft (
    task_draft_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    estimate_id uuid NOT NULL,
    project_draft_id uuid,
    task_id uuid,
    task_number integer NOT NULL,
    project_id uuid,
    external_key character varying(100),
    title character varying(255),
    description text,
    task_status_id character varying(50),
    owner_id uuid,
    budget numeric(12,2),
    task_details jsonb,
    start_date date,
    end_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    initial_actual numeric(12,2) DEFAULT 0.00,
    created_by uuid
);

-- ============================================================================
-- PM RECONCILIATION TEMPLATE
-- ============================================================================

CREATE TABLE public.pm_reconciliation_template (
    template_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    pm_id uuid NOT NULL,
    company_id uuid NOT NULL,
    template_name character varying(255) NOT NULL,
    staging_table_name character varying(100) NOT NULL,
    column_names jsonb NOT NULL,
    last_upload_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    sql_query text
);

COMMENT ON TABLE public.pm_reconciliation_template IS 'Single reconciliation template per PM with SQL mapping query';

-- ============================================================================
-- TIMESHEET RECONCILIATION
-- ============================================================================

CREATE TABLE public.timesheet_reconciliation (
    reconciliation_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    timestamp_reconciliation timestamp without time zone NOT NULL,
    company_id uuid NOT NULL,
    external_key character varying(100) NOT NULL,
    total_hours numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    user_id uuid NOT NULL,
    pm_id uuid
);

COMMENT ON TABLE public.timesheet_reconciliation IS 'External timesheet reconciliation data';

-- ============================================================================
-- VIEW: v_task_code
-- ============================================================================

CREATE VIEW public.v_task_code AS
 SELECT t.task_id,
    c.company_id,
    cl.client_id,
    p.project_id,
    (((((((c.company_key)::text || '-'::text) || (cl.client_key)::text) || '-'::text) || (p.project_key)::text) || '-'::text) || t.task_number) AS task_code,
    c.company_key,
    cl.client_key,
    p.project_key,
    t.task_number,
    t.title,
    t.description,
    t.task_status_id,
    t.owner_id,
    t.budget,
    t.start_date,
    t.end_date,
    t.created_at,
    t.updated_at
   FROM (((public.task t
     JOIN public.project p ON ((t.project_id = p.project_id)))
     JOIN public.client cl ON ((p.client_id = cl.client_id)))
     JOIN public.company c ON ((cl.company_id = c.company_id)));

-- ============================================================================
-- PRIMARY KEYS
-- ============================================================================

ALTER TABLE ONLY public.role ADD CONSTRAINT role_pkey PRIMARY KEY (role_id);
ALTER TABLE ONLY public.status ADD CONSTRAINT status_pkey PRIMARY KEY (status_id);
ALTER TABLE ONLY public.task_status ADD CONSTRAINT task_status_pkey PRIMARY KEY (task_status_id);
ALTER TABLE ONLY public.time_off_type ADD CONSTRAINT time_off_type_pkey PRIMARY KEY (time_off_type_id);
ALTER TABLE ONLY public.estimate_status ADD CONSTRAINT estimate_status_pkey PRIMARY KEY (estimate_status_id);
ALTER TABLE ONLY public.project_status ADD CONSTRAINT project_status_pkey PRIMARY KEY (project_status_id);
ALTER TABLE ONLY public.project_type ADD CONSTRAINT project_type_pkey PRIMARY KEY (project_type_id);
ALTER TABLE ONLY public.company ADD CONSTRAINT company_pkey PRIMARY KEY (company_id);
ALTER TABLE ONLY public.users ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.client ADD CONSTRAINT client_pkey PRIMARY KEY (client_id);
ALTER TABLE ONLY public.project ADD CONSTRAINT project_pkey PRIMARY KEY (project_id);
ALTER TABLE ONLY public.project_manager ADD CONSTRAINT project_manager_pkey PRIMARY KEY (project_id, user_id);
ALTER TABLE ONLY public.task_sequence ADD CONSTRAINT task_sequence_pkey PRIMARY KEY (project_id);
ALTER TABLE ONLY public.task ADD CONSTRAINT task_pkey PRIMARY KEY (task_id);
ALTER TABLE ONLY public.task_etc ADD CONSTRAINT task_etc_pkey PRIMARY KEY (etc_id);
ALTER TABLE ONLY public.timesheet_snapshot ADD CONSTRAINT timesheet_snapshot_pkey PRIMARY KEY (snapshot_id);
ALTER TABLE ONLY public.task_timesheet ADD CONSTRAINT task_timesheet_pkey PRIMARY KEY (timesheet_id);
ALTER TABLE ONLY public.holiday_calendar ADD CONSTRAINT holiday_calendar_pkey PRIMARY KEY (holiday_id);
ALTER TABLE ONLY public.user_time_off_plan ADD CONSTRAINT user_time_off_plan_pkey PRIMARY KEY (time_off_id);
ALTER TABLE ONLY public.estimate ADD CONSTRAINT estimate_pkey PRIMARY KEY (estimate_id);
ALTER TABLE ONLY public.estimate_task ADD CONSTRAINT estimate_task_pkey PRIMARY KEY (estimate_task_id);
ALTER TABLE ONLY public.project_draft ADD CONSTRAINT project_draft_pkey PRIMARY KEY (project_draft_id);
ALTER TABLE ONLY public.task_draft ADD CONSTRAINT task_draft_pkey PRIMARY KEY (task_draft_id);
ALTER TABLE ONLY public.pm_reconciliation_template ADD CONSTRAINT pm_reconciliation_template_pkey PRIMARY KEY (template_id);
ALTER TABLE ONLY public.timesheet_reconciliation ADD CONSTRAINT timesheet_reconciliation_pkey PRIMARY KEY (reconciliation_id);

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

ALTER TABLE ONLY public.company ADD CONSTRAINT company_company_key_key UNIQUE (company_key);
ALTER TABLE ONLY public.users ADD CONSTRAINT user_email_key UNIQUE (email);
ALTER TABLE ONLY public.client ADD CONSTRAINT uk_client_company_key UNIQUE (company_id, client_key);
ALTER TABLE ONLY public.project ADD CONSTRAINT uk_project_client_key UNIQUE (client_id, project_key);
ALTER TABLE ONLY public.task ADD CONSTRAINT uk_task_project_number UNIQUE (project_id, task_number);
ALTER TABLE ONLY public.task_etc ADD CONSTRAINT uq_task_etc_task_id UNIQUE (task_id);
ALTER TABLE ONLY public.task_timesheet ADD CONSTRAINT uk_timesheet_task_user_date UNIQUE (task_id, user_id, timesheet_date);
ALTER TABLE ONLY public.holiday_calendar ADD CONSTRAINT uk_holiday_name_date_company UNIQUE (name, date, company_id);
ALTER TABLE ONLY public.pm_reconciliation_template ADD CONSTRAINT pm_reconciliation_template_pm_unique UNIQUE (pm_id);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_user_company_id ON public.users USING btree (company_id);
CREATE INDEX idx_user_company_user ON public.users USING btree (company_id, user_id);
CREATE INDEX idx_client_company_id ON public.client USING btree (company_id);
CREATE INDEX idx_client_company_client ON public.client USING btree (company_id, client_id);
CREATE INDEX idx_pm_user_id ON public.project_manager USING btree (user_id);
CREATE INDEX idx_task_project_id ON public.task USING btree (project_id);
CREATE INDEX idx_task_external_key ON public.task USING btree (external_key);
CREATE INDEX idx_etc_company_id ON public.task_etc USING btree (company_id);
CREATE INDEX idx_etc_company_task ON public.task_etc USING btree (company_id, task_id);
CREATE INDEX idx_snapshot_user_id ON public.timesheet_snapshot USING btree (user_id);
CREATE INDEX idx_snapshot_company_id ON public.timesheet_snapshot USING btree (company_id);
CREATE INDEX idx_snapshot_user_submitted ON public.timesheet_snapshot USING btree (user_id, is_submitted);
CREATE INDEX idx_timesheet_company_id ON public.task_timesheet USING btree (company_id);
CREATE INDEX idx_timesheet_company_task ON public.task_timesheet USING btree (company_id, task_id);
CREATE INDEX idx_timesheet_company_user ON public.task_timesheet USING btree (company_id, user_id);
CREATE INDEX idx_timesheet_user_date ON public.task_timesheet USING btree (user_id, timesheet_date);
CREATE INDEX idx_holiday_company_date ON public.holiday_calendar USING btree (company_id, date);
CREATE INDEX idx_timeoff_company_id ON public.user_time_off_plan USING btree (company_id);
CREATE INDEX idx_timeoff_company_user ON public.user_time_off_plan USING btree (company_id, user_id);
CREATE INDEX idx_timeoff_user_date ON public.user_time_off_plan USING btree (user_id, date);
CREATE INDEX idx_estimate_client_id ON public.estimate USING btree (client_id);
CREATE INDEX idx_estimate_status ON public.estimate USING btree (status);
CREATE INDEX idx_estimate_project_id ON public.estimate USING btree (project_id);
CREATE INDEX idx_estimate_created_at ON public.estimate USING btree (created_at);
CREATE INDEX idx_estimate_task_estimate_id ON public.estimate_task USING btree (estimate_id);
CREATE INDEX idx_project_draft_estimate_id ON public.project_draft USING btree (estimate_id);
CREATE INDEX idx_project_draft_client_id ON public.project_draft USING btree (client_id);
CREATE INDEX idx_project_draft_project_id ON public.project_draft USING btree (project_id);
CREATE INDEX idx_project_draft_created_by ON public.project_draft USING btree (created_by);
CREATE INDEX idx_project_draft_created_at ON public.project_draft USING btree (created_at);
CREATE INDEX idx_task_draft_estimate_id ON public.task_draft USING btree (estimate_id);
CREATE INDEX idx_task_draft_project_draft_id ON public.task_draft USING btree (project_draft_id);
CREATE INDEX idx_task_draft_project_id ON public.task_draft USING btree (project_id);
CREATE INDEX idx_task_draft_task_id ON public.task_draft USING btree (task_id);
CREATE INDEX idx_task_draft_owner_id ON public.task_draft USING btree (owner_id);
CREATE INDEX idx_task_draft_created_by ON public.task_draft USING btree (created_by);
CREATE INDEX idx_task_draft_created_at ON public.task_draft USING btree (created_at);
CREATE UNIQUE INDEX idx_template_pm ON public.pm_reconciliation_template USING btree (pm_id);
CREATE INDEX idx_template_company ON public.pm_reconciliation_template USING btree (company_id);
CREATE INDEX idx_reconciliation_company_id ON public.timesheet_reconciliation USING btree (company_id);
CREATE INDEX idx_reconciliation_pm_id ON public.timesheet_reconciliation USING btree (pm_id);

-- ============================================================================
-- TRIGGERS (auto-update updated_at)
-- ============================================================================

CREATE TRIGGER update_company_updated_at BEFORE UPDATE ON public.company FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_client_updated_at BEFORE UPDATE ON public.client FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON public.project FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_type_updated_at BEFORE UPDATE ON public.project_type FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pm_updated_at BEFORE UPDATE ON public.project_manager FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_task_seq_updated_at BEFORE UPDATE ON public.task_sequence FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_task_updated_at BEFORE UPDATE ON public.task FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_etc_updated_at BEFORE UPDATE ON public.task_etc FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timesheet_updated_at BEFORE UPDATE ON public.task_timesheet FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_holiday_updated_at BEFORE UPDATE ON public.holiday_calendar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_timeoff_updated_at BEFORE UPDATE ON public.user_time_off_plan FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_template_updated_at BEFORE UPDATE ON public.pm_reconciliation_template FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reconciliation_updated_at BEFORE UPDATE ON public.timesheet_reconciliation FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FOREIGN KEYS
-- ============================================================================

-- Company
ALTER TABLE ONLY public.company ADD CONSTRAINT fk_company_status FOREIGN KEY (status_id) REFERENCES public.status(status_id);

-- Users
ALTER TABLE ONLY public.users ADD CONSTRAINT fk_user_company FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.users ADD CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES public.role(role_id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.users ADD CONSTRAINT fk_user_status FOREIGN KEY (status_id) REFERENCES public.status(status_id) ON DELETE RESTRICT;

-- Client
ALTER TABLE ONLY public.client ADD CONSTRAINT fk_client_company FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;

-- Project
ALTER TABLE ONLY public.project ADD CONSTRAINT fk_project_client FOREIGN KEY (client_id) REFERENCES public.client(client_id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.project ADD CONSTRAINT fk_project_status FOREIGN KEY (status_id) REFERENCES public.status(status_id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.project ADD CONSTRAINT fk_project_type FOREIGN KEY (project_type_id) REFERENCES public.project_type(project_type_id) ON DELETE RESTRICT;

-- Project Manager
ALTER TABLE ONLY public.project_manager ADD CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES public.project(project_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.project_manager ADD CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;

-- Task Sequence
ALTER TABLE ONLY public.task_sequence ADD CONSTRAINT fk_task_seq_project FOREIGN KEY (project_id) REFERENCES public.project(project_id) ON DELETE CASCADE;

-- Task
ALTER TABLE ONLY public.task ADD CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES public.project(project_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.task ADD CONSTRAINT fk_task_status FOREIGN KEY (task_status_id) REFERENCES public.task_status(task_status_id) ON DELETE RESTRICT;
ALTER TABLE ONLY public.task ADD CONSTRAINT fk_task_owner FOREIGN KEY (owner_id) REFERENCES public.users(user_id) ON DELETE SET NULL;

-- Task ETC
ALTER TABLE ONLY public.task_etc ADD CONSTRAINT fk_etc_task FOREIGN KEY (task_id) REFERENCES public.task(task_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.task_etc ADD CONSTRAINT fk_etc_company FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;

-- Timesheet Snapshot
ALTER TABLE ONLY public.timesheet_snapshot ADD CONSTRAINT fk_snapshot_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.timesheet_snapshot ADD CONSTRAINT fk_snapshot_company FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;

-- Task Timesheet
ALTER TABLE ONLY public.task_timesheet ADD CONSTRAINT fk_timesheet_task FOREIGN KEY (task_id) REFERENCES public.task(task_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.task_timesheet ADD CONSTRAINT fk_timesheet_company FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.task_timesheet ADD CONSTRAINT fk_timesheet_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.task_timesheet ADD CONSTRAINT fk_timesheet_snapshot FOREIGN KEY (snapshot_id) REFERENCES public.timesheet_snapshot(snapshot_id) ON DELETE SET NULL;

-- Holiday Calendar
ALTER TABLE ONLY public.holiday_calendar ADD CONSTRAINT fk_holiday_company FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;

-- User Time Off Plan
ALTER TABLE ONLY public.user_time_off_plan ADD CONSTRAINT fk_timeoff_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_time_off_plan ADD CONSTRAINT fk_timeoff_company FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_time_off_plan ADD CONSTRAINT fk_timeoff_type FOREIGN KEY (time_off_type_id) REFERENCES public.time_off_type(time_off_type_id) ON DELETE RESTRICT;

-- Estimate
ALTER TABLE ONLY public.estimate ADD CONSTRAINT estimate_client_fkey FOREIGN KEY (client_id) REFERENCES public.client(client_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.estimate ADD CONSTRAINT estimate_project_fkey FOREIGN KEY (project_id) REFERENCES public.project(project_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.estimate ADD CONSTRAINT estimate_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.estimate ADD CONSTRAINT estimate_status_fkey FOREIGN KEY (status) REFERENCES public.estimate_status(estimate_status_id);

-- Estimate Task
ALTER TABLE ONLY public.estimate_task ADD CONSTRAINT estimate_task_estimate_fkey FOREIGN KEY (estimate_id) REFERENCES public.estimate(estimate_id) ON DELETE CASCADE;

-- Project Draft
ALTER TABLE ONLY public.project_draft ADD CONSTRAINT project_draft_estimate_fkey FOREIGN KEY (estimate_id) REFERENCES public.estimate(estimate_id) ON DELETE CASCADE;

-- Task Draft
ALTER TABLE ONLY public.task_draft ADD CONSTRAINT task_draft_estimate_fkey FOREIGN KEY (estimate_id) REFERENCES public.estimate(estimate_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.task_draft ADD CONSTRAINT task_draft_project_draft_fkey FOREIGN KEY (project_draft_id) REFERENCES public.project_draft(project_draft_id) ON DELETE CASCADE;

-- PM Reconciliation Template
ALTER TABLE ONLY public.pm_reconciliation_template ADD CONSTRAINT fk_template_pm FOREIGN KEY (pm_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.pm_reconciliation_template ADD CONSTRAINT fk_template_company FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;

-- Timesheet Reconciliation
ALTER TABLE ONLY public.timesheet_reconciliation ADD CONSTRAINT fk_reconciliation_company FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.timesheet_reconciliation ADD CONSTRAINT fk_reconciliation_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;
ALTER TABLE ONLY public.timesheet_reconciliation ADD CONSTRAINT fk_reconciliation_pm FOREIGN KEY (pm_id) REFERENCES public.users(user_id) ON DELETE SET NULL;

-- ============================================================================
-- SEED: LOOKUP DATA
-- ============================================================================

INSERT INTO public.role (role_id, description) VALUES
  ('ADMIN', 'Amministratore'),
  ('PM', 'Project Manager'),
  ('USER', 'Utente')
ON CONFLICT (role_id) DO NOTHING;

INSERT INTO public.status (status_id, description) VALUES
  ('ACTIVE', 'Attivo'),
  ('DELETED', 'Cancellato')
ON CONFLICT (status_id) DO NOTHING;

INSERT INTO public.task_status (task_status_id, description) VALUES
  ('TODO', 'Da fare'),
  ('IN PROGRESS', 'In corso'),
  ('DONE', 'Completato'),
  ('NEW', 'Nuovo'),
  ('DELETED', 'Cancellato')
ON CONFLICT (task_status_id) DO NOTHING;

INSERT INTO public.time_off_type (time_off_type_id, description) VALUES
  ('FERIE', 'Ferie'),
  ('PERMESSO', 'Permesso'),
  ('MALATTIA', 'Malattia'),
  ('ROL', 'Riduzione Orario Lavoro')
ON CONFLICT (time_off_type_id) DO NOTHING;

INSERT INTO public.estimate_status (estimate_status_id, description) VALUES
  ('DRAFT', 'Bozza'),
  ('CONVERTED', 'Convertita in progetto'),
  ('DELETED', 'Stima cancellata')
ON CONFLICT (estimate_status_id) DO NOTHING;

INSERT INTO public.project_type (project_type_id, description) VALUES
  ('PROJECT', 'Progetto a corpo'),
  ('TM', 'Time & Material')
ON CONFLICT (project_type_id) DO NOTHING;
