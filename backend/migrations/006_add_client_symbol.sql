-- Aggiunge campi per il simbolo cliente: lettera, colore sfondo, colore lettera
ALTER TABLE public.client
  ADD COLUMN symbol_letter character varying(1),
  ADD COLUMN symbol_bg_color character varying(7) DEFAULT '#6B7280',
  ADD COLUMN symbol_letter_color character varying(7) DEFAULT '#FFFFFF';
