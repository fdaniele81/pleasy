-- Aggiunge campi per il simbolo utente: lettera, colore sfondo, colore lettera
ALTER TABLE public.users
  ADD COLUMN symbol_letter character varying(2),
  ADD COLUMN symbol_bg_color character varying(7) DEFAULT '#6B7280',
  ADD COLUMN symbol_letter_color character varying(7) DEFAULT '#FFFFFF';
