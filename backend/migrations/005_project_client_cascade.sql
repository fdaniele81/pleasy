-- Cambia FK project → client da RESTRICT a CASCADE
-- Un progetto senza client non ha senso, e il cascade
-- permette di pulire tutti i dati di una company con un singolo DELETE.

ALTER TABLE ONLY public.project
  DROP CONSTRAINT fk_project_client;

ALTER TABLE ONLY public.project
  ADD CONSTRAINT fk_project_client
  FOREIGN KEY (client_id) REFERENCES public.client(client_id)
  ON DELETE CASCADE;
