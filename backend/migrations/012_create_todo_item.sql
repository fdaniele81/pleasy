-- Migration 012: Create todo_item table for free-form to-do entries (not tied to timesheets)

CREATE TABLE IF NOT EXISTS public.todo_item (
    todo_item_id UUID DEFAULT uuid_generate_v4() NOT NULL,
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    title CHARACTER VARYING(255) NOT NULL,
    details TEXT,
    due_date DATE,
    task_id UUID,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT todo_item_pkey PRIMARY KEY (todo_item_id),
    CONSTRAINT fk_todo_item_user FOREIGN KEY (user_id)
        REFERENCES public.users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_todo_item_company FOREIGN KEY (company_id)
        REFERENCES public.company(company_id) ON DELETE CASCADE,
    CONSTRAINT fk_todo_item_task FOREIGN KEY (task_id)
        REFERENCES public.task(task_id) ON DELETE SET NULL
);

CREATE INDEX idx_todo_item_user ON public.todo_item (user_id);
CREATE INDEX idx_todo_item_user_due_date ON public.todo_item (user_id, due_date);
