-- Migration 013: Create user_scratchpad table for persistent personal notes

CREATE TABLE IF NOT EXISTS public.user_scratchpad (
    user_id UUID NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    CONSTRAINT user_scratchpad_pkey PRIMARY KEY (user_id),
    CONSTRAINT fk_scratchpad_user FOREIGN KEY (user_id)
        REFERENCES public.users(user_id) ON DELETE CASCADE
);
