-- Aggiunge flag per forzare il cambio password al primo accesso.
-- L'utente admin seed ha must_change_password = true di default.

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;

-- Forza cambio password per l'utente admin seed
UPDATE public.users
SET must_change_password = true
WHERE email = 'admin@system.local';
