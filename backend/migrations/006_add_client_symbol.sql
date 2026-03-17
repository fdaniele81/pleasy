-- Aggiunge campi per il simbolo cliente: lettera, colore sfondo, colore lettera
ALTER TABLE public.client
  ADD COLUMN symbol_letter character varying(2),
  ADD COLUMN symbol_bg_color character varying(7) DEFAULT '#6B7280',
  ADD COLUMN symbol_letter_color character varying(7) DEFAULT '#FFFFFF';

-- Popola i simboli per i clienti esistenti:
--   symbol_letter = prime 2 lettere maiuscole del nome cliente
--   symbol_bg_color = colore del cliente (o grigio di default)
--   symbol_letter_color = bianco
UPDATE public.client
SET
  symbol_letter = UPPER(LEFT(client_name, 2)),
  symbol_bg_color = COALESCE(color, '#6B7280'),
  symbol_letter_color = '#FFFFFF'
WHERE symbol_letter IS NULL;
