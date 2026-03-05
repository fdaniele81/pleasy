-- ============================================================================
-- PLEASY — Database di esempio (DEMO / SANDBOX)
-- ============================================================================
--
-- SCOPO DI QUESTO FILE
-- --------------------
-- Popola il database con dati fittizi ma realistici, pensati per:
--   - Provare l'applicazione subito dopo l'installazione
--   - Esplorare tutte le funzionalità (progetti, task, timesheet, ferie, stime)
--   - Eseguire test manuali o automatizzati
--   - Fare demo a stakeholder e nuovi sviluppatori
--
-- I dati NON sono reali: nomi, aziende e progetti sono inventati.
-- Puoi cancellare e ri-eseguire questo seed in qualsiasi momento senza
-- conseguenze su dati di produzione.
--
-- SCENARIO
-- --------
-- "Toon Studios S.r.l." — uno studio fittizio di produzione di cartoni animati
-- con 5 clienti, 10 progetti, 45 task, 62 registrazioni timesheet,
-- festività italiane 2026 e richieste di ferie.
--
-- PREREQUISITI
-- ------------
-- 1. Eseguire PRIMA schema.sql (crea tabelle, estensioni e dati di dominio)
-- 2. Le tabelle di lookup (role, status, task_status, ecc.) sono già popolate
--    da schema.sql — questo file usa SOLO i valori definiti lì.
--
-- UTENTI CREATI (password per tutti: admin123)
-- ┌─────────────────┬───────┬────────────────────────────────┬─────────────────┐
-- │ Nome            │ Ruolo │ Email                          │ Azienda         │
-- ├─────────────────┼───────┼────────────────────────────────┼─────────────────┤
-- │ Marco Animato   │ PM    │ marco.animato@toonstudios.it   │ Toon Studios    │
-- │ Luna Disegni    │ USER  │ luna.disegni@toonstudios.it    │ Toon Studios    │
-- │ Stella Colori   │ USER  │ stella.colori@toonstudios.it   │ Toon Studios    │
-- │ Riko Montaggio  │ USER  │ riko.montaggio@toonstudios.it  │ Toon Studios    │
-- └─────────────────┴───────┴────────────────────────────────┴─────────────────┘
-- N.B. L'utente ADMIN (admin@system.local) viene creato da schema.sql
--
-- ============================================================================

-- Chiude eventuali transazioni fallite rimaste aperte
ROLLBACK;

BEGIN;

-- ============================================================================
-- COMPANY: Toon Studios S.r.l.
-- ============================================================================

INSERT INTO public.company (company_id, company_key, legal_name, vat_number, status_id)
VALUES ('a1b2c3d4-0001-4000-a000-000000000001', 'TOON', 'Toon Studios S.r.l.', 'IT12345678901', 'ACTIVE')
ON CONFLICT (company_key) DO NOTHING;

-- ============================================================================
-- USERS
-- ============================================================================
-- Password: admin123 → $2b$10$CkAm1XpjTk9hrVRdQs9dh.UU9nvdylxH7tK9mUtfiP0L5ilVAoy7q

-- PM: Marco Animato
INSERT INTO public.users (user_id, company_id, email, password_hash, role_id, status_id, full_name)
VALUES (
  'b1b2c3d4-0001-4000-b000-000000000001',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'marco.animato@toonstudios.it',
  '$2b$10$CkAm1XpjTk9hrVRdQs9dh.UU9nvdylxH7tK9mUtfiP0L5ilVAoy7q',
  'PM',
  'ACTIVE',
  'Marco Animato'
)
ON CONFLICT (email) DO NOTHING;

-- USER: Luna Disegni
INSERT INTO public.users (user_id, company_id, email, password_hash, role_id, status_id, full_name)
VALUES (
  'b1b2c3d4-0002-4000-b000-000000000002',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'luna.disegni@toonstudios.it',
  '$2b$10$CkAm1XpjTk9hrVRdQs9dh.UU9nvdylxH7tK9mUtfiP0L5ilVAoy7q',
  'USER',
  'ACTIVE',
  'Luna Disegni'
)
ON CONFLICT (email) DO NOTHING;

-- USER: Stella Colori
INSERT INTO public.users (user_id, company_id, email, password_hash, role_id, status_id, full_name)
VALUES (
  'b1b2c3d4-0003-4000-b000-000000000003',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'stella.colori@toonstudios.it',
  '$2b$10$CkAm1XpjTk9hrVRdQs9dh.UU9nvdylxH7tK9mUtfiP0L5ilVAoy7q',
  'USER',
  'ACTIVE',
  'Stella Colori'
)
ON CONFLICT (email) DO NOTHING;

-- USER: Riko Montaggio
INSERT INTO public.users (user_id, company_id, email, password_hash, role_id, status_id, full_name)
VALUES (
  'b1b2c3d4-0004-4000-b000-000000000004',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'riko.montaggio@toonstudios.it',
  '$2b$10$CkAm1XpjTk9hrVRdQs9dh.UU9nvdylxH7tK9mUtfiP0L5ilVAoy7q',
  'USER',
  'ACTIVE',
  'Riko Montaggio'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- CLIENTS
-- ============================================================================

-- Client 1: Looney Productions
INSERT INTO public.client (client_id, company_id, client_key, client_name, client_description, status_id, color)
VALUES (
  'c1c2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'LOONEY',
  'Looney Productions',
  'Studio di produzione specializzato in cartoon comici e slapstick',
  'ACTIVE',
  '#EF4444'
)
ON CONFLICT ON CONSTRAINT uk_client_company_key DO NOTHING;

-- Client 2: Pixar Dreams
INSERT INTO public.client (client_id, company_id, client_key, client_name, client_description, status_id, color)
VALUES (
  'c1c2c3d4-0002-4000-8000-000000000002',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'PIXAR',
  'Pixar Dreams Entertainment',
  'Produzione animazione 3D di alta qualità',
  'ACTIVE',
  '#3B82F6'
)
ON CONFLICT ON CONSTRAINT uk_client_company_key DO NOTHING;

-- Client 3: Ghibli Italia
INSERT INTO public.client (client_id, company_id, client_key, client_name, client_description, status_id, color)
VALUES (
  'c1c2c3d4-0003-4000-8000-000000000003',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'GHIBLI',
  'Ghibli Italia S.p.A.',
  'Divisione italiana dello studio di animazione giapponese',
  'ACTIVE',
  '#10B981'
)
ON CONFLICT ON CONSTRAINT uk_client_company_key DO NOTHING;

-- Client 4: Disney Classics
INSERT INTO public.client (client_id, company_id, client_key, client_name, client_description, status_id, color)
VALUES (
  'c1c2c3d4-0004-4000-8000-000000000004',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'DISNEY',
  'Disney Classics Italia',
  'Produzione remake e adattamenti dei classici Disney per il mercato italiano',
  'ACTIVE',
  '#F59E0B'
)
ON CONFLICT ON CONSTRAINT uk_client_company_key DO NOTHING;

-- Client 5: Nickelodeon Europe
INSERT INTO public.client (client_id, company_id, client_key, client_name, client_description, status_id, color)
VALUES (
  'c1c2c3d4-0005-4000-8000-000000000005',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'NICK',
  'Nickelodeon Europe S.r.l.',
  'Divisione europea di Nickelodeon per produzioni animate originali',
  'ACTIVE',
  '#8B5CF6'
)
ON CONFLICT ON CONSTRAINT uk_client_company_key DO NOTHING;

-- ============================================================================
-- PROJECTS (10 totali)
-- ============================================================================

-- Progetto 1: Bugs Bunny Reboot (Looney, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0001-4000-9000-000000000001',
  'c1c2c3d4-0001-4000-8000-000000000001',
  'BUGS',
  'Bugs Bunny - Il Reboot',
  'Reboot della serie classica di Bugs Bunny con animazione moderna. 12 episodi, prima stagione.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 2: Road Runner VFX (Looney, TM, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0002-4000-9000-000000000002',
  'c1c2c3d4-0001-4000-8000-000000000001',
  'ROAD',
  'Road Runner - Effetti Speciali',
  'VFX e post-produzione per il film Road Runner & Wile E. Coyote. Time & Material.',
  'ACTIVE',
  'TM',
  false
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 3: Toy Story Spinoff (Pixar, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0003-4000-9000-000000000003',
  'c1c2c3d4-0002-4000-8000-000000000002',
  'TOYS',
  'Toy Story - Le Avventure di Forky',
  'Serie spinoff dedicata a Forky. 8 episodi di 22 minuti ciascuno.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 4: Spirited Away Musical (Ghibli, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0004-4000-9000-000000000004',
  'c1c2c3d4-0003-4000-8000-000000000003',
  'SPIRIT',
  'La Città Incantata - Musical Animato',
  'Adattamento musical animato de La Città Incantata per il mercato europeo.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 5: Tweety & Sylvester Shorts (Looney, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0005-4000-9000-000000000005',
  'c1c2c3d4-0001-4000-8000-000000000001',
  'TWEETY',
  'Tweety & Sylvester - Corti Animati',
  'Serie di 10 cortometraggi animati (3 min ciascuno) con Titti e Gatto Silvestro. Stile retrò rivisitato.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 6: Gli Incredibili - Missioni Segrete (Pixar, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0006-4000-9000-000000000006',
  'c1c2c3d4-0002-4000-8000-000000000002',
  'INCRE',
  'Gli Incredibili - Missioni Segrete',
  'Serie animata spin-off della famiglia Parr. 10 episodi da 15 minuti, animazione 3D stilizzata.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 7: Il Mio Vicino Totoro - Serie TV (Ghibli, TM, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0007-4000-9000-000000000007',
  'c1c2c3d4-0003-4000-8000-000000000003',
  'TOTORO',
  'Il Mio Vicino Totoro - Serie TV',
  'Adattamento in serie TV del classico Ghibli. 6 episodi da 25 minuti, animazione tradizionale. Time & Material.',
  'ACTIVE',
  'TM',
  false
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 8: Il Re Leone - Prequel Animato (Disney, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0008-4000-9000-000000000008',
  'c1c2c3d4-0004-4000-8000-000000000004',
  'SIMBA',
  'Il Re Leone - Le Origini di Mufasa',
  'Film prequel animato sulle origini di Mufasa. 90 minuti, animazione 2D con fondali digitali.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 9: Alice nel Paese delle Meraviglie 2.0 (Disney, TM, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0009-4000-9000-000000000009',
  'c1c2c3d4-0004-4000-8000-000000000004',
  'ALICE',
  'Alice nel Paese delle Meraviglie 2.0',
  'Rivisitazione interattiva del classico con elementi di realtà aumentata. Prototipo + 4 episodi pilota.',
  'ACTIVE',
  'TM',
  false
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 10: SpongeBob - Il Film Italiano (Nick, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0010-4000-9000-000000000010',
  'c1c2c3d4-0005-4000-8000-000000000005',
  'SPONGE',
  'SpongeBob - Il Grande Film Italiano',
  'Film animato originale SpongeBob ambientato in Italia. 75 minuti, co-produzione con Paramount.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- ============================================================================
-- PROJECT MANAGERS (Marco Animato è PM di tutti i progetti)
-- ============================================================================

INSERT INTO public.project_manager (project_id, user_id) VALUES
  ('d1d2d3d4-0001-4000-9000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0002-4000-9000-000000000002', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0003-4000-9000-000000000003', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0004-4000-9000-000000000004', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0005-4000-9000-000000000005', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0006-4000-9000-000000000006', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0007-4000-9000-000000000007', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0008-4000-9000-000000000008', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0009-4000-9000-000000000009', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0010-4000-9000-000000000010', 'b1b2c3d4-0001-4000-b000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASK SEQUENCES
-- ============================================================================

INSERT INTO public.task_sequence (project_id, last_task_number) VALUES
  ('d1d2d3d4-0001-4000-9000-000000000001', 5),
  ('d1d2d3d4-0002-4000-9000-000000000002', 3),
  ('d1d2d3d4-0003-4000-9000-000000000003', 4),
  ('d1d2d3d4-0004-4000-9000-000000000004', 4),
  ('d1d2d3d4-0005-4000-9000-000000000005', 5),
  ('d1d2d3d4-0006-4000-9000-000000000006', 5),
  ('d1d2d3d4-0007-4000-9000-000000000007', 4),
  ('d1d2d3d4-0008-4000-9000-000000000008', 6),
  ('d1d2d3d4-0009-4000-9000-000000000009', 4),
  ('d1d2d3d4-0010-4000-9000-000000000010', 5)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Bugs Bunny Reboot (5 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0001-4000-a000-000000000001', 1,
  'd1d2d3d4-0001-4000-9000-000000000001',
  'Character Design - Bugs Bunny',
  'Redesign del personaggio principale con stile moderno mantenendo i tratti iconici. Include model sheet, turnaround e expression sheet.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  80.00,
  '2025-09-01', '2025-10-15'
),
(
  'e1e2e3e4-0002-4000-a000-000000000002', 2,
  'd1d2d3d4-0001-4000-9000-000000000001',
  'Storyboard Episodio Pilota',
  'Storyboard completo per il primo episodio "La Grande Fuga dalla Tana". 180 scene, 22 minuti.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  120.00,
  '2025-10-01', '2025-11-30'
),
(
  'e1e2e3e4-0003-4000-a000-000000000003', 3,
  'd1d2d3d4-0001-4000-9000-000000000001',
  'Animazione Episodio 1',
  'Animazione 2D completa dell''episodio pilota. Key animation, in-between, clean-up e coloring.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  200.00,
  '2025-12-01', '2026-03-31'
),
(
  'e1e2e3e4-0004-4000-a000-000000000004', 4,
  'd1d2d3d4-0001-4000-9000-000000000001',
  'Background Art - Stagione 1',
  'Creazione di tutti i fondali per la prima stagione. Stile acquerello digitale con palette vivace.',
  'IN PROGRESS',
  'b1b2c3d4-0001-4000-b000-000000000001',
  150.00,
  '2025-11-15', '2026-04-30'
),
(
  'e1e2e3e4-0005-4000-a000-000000000005', 5,
  'd1d2d3d4-0001-4000-9000-000000000001',
  'Compositing e Post-Produzione',
  'Compositing finale, color correction e output per broadcast.',
  'NEW',
  NULL,
  100.00,
  '2026-04-01', '2026-06-30'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Road Runner VFX (3 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0006-4000-a000-000000000006', 1,
  'd1d2d3d4-0002-4000-9000-000000000002',
  'Esplosioni ACME - VFX',
  'Effetti speciali per tutte le esplosioni dei prodotti ACME. 45 shot da completare con simulazione particellare.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  160.00,
  '2025-11-01', '2026-03-15'
),
(
  'e1e2e3e4-0007-4000-a000-000000000007', 2,
  'd1d2d3d4-0002-4000-9000-000000000002',
  'Dust Trail - Effetto Polvere',
  'Creazione dell''effetto polvere tipico del Road Runner in corsa. Simulazione fluidi e compositing.',
  'NEW',
  'b1b2c3d4-0002-4000-b000-000000000002',
  90.00,
  '2026-01-15', '2026-04-30'
),
(
  'e1e2e3e4-0008-4000-a000-000000000008', 3,
  'd1d2d3d4-0002-4000-9000-000000000002',
  'Canyon Environment - Matte Painting',
  'Matte painting digitali per gli ambienti del canyon. 12 scenari unici con varianti di illuminazione.',
  'NEW',
  NULL,
  70.00,
  '2026-02-01', '2026-05-15'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Toy Story Spinoff (4 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0009-4000-a000-000000000009', 1,
  'd1d2d3d4-0003-4000-9000-000000000003',
  'Modellazione 3D - Forky e Amici',
  'Modellazione e rigging di Forky, Knifey e 4 nuovi personaggi secondari.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  100.00,
  '2025-08-01', '2025-10-30'
),
(
  'e1e2e3e4-0010-4000-a000-000000000010', 2,
  'd1d2d3d4-0003-4000-9000-000000000003',
  'Sceneggiatura Ep. 1-4',
  'Scrittura delle sceneggiature per i primi 4 episodi con revisioni e approvazione cliente.',
  'IN PROGRESS',
  'b1b2c3d4-0001-4000-b000-000000000001',
  60.00,
  '2025-10-01', '2026-01-31'
),
(
  'e1e2e3e4-0011-4000-a000-000000000011', 3,
  'd1d2d3d4-0003-4000-9000-000000000003',
  'Layout e Previz Episodio 1',
  'Layout 3D e previsualizzazione completa del primo episodio. Camera work e blocking.',
  'NEW',
  'b1b2c3d4-0002-4000-b000-000000000002',
  80.00,
  '2026-02-01', '2026-04-30'
),
(
  'e1e2e3e4-0012-4000-a000-000000000012', 4,
  'd1d2d3d4-0003-4000-9000-000000000003',
  'Texturing e Shading',
  'Texturing e shading di tutti gli asset 3D. Stile stilizzato coerente con l''universo Toy Story.',
  'NEW',
  NULL,
  110.00,
  '2026-03-01', '2026-06-30'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - La Città Incantata Musical (4 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0013-4000-a000-000000000013', 1,
  'd1d2d3d4-0004-4000-9000-000000000004',
  'Concept Art - Mondo degli Spiriti',
  'Concept art per tutti gli ambienti del mondo degli spiriti. 20 tavole in stile acquerello tradizionale.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  90.00,
  '2025-07-01', '2025-09-30'
),
(
  'e1e2e3e4-0014-4000-a000-000000000014', 2,
  'd1d2d3d4-0004-4000-9000-000000000004',
  'Coreografie Animate',
  'Animazione delle sequenze musicali. 6 numeri musicali con coreografie sincronizzate.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  180.00,
  '2025-10-01', '2026-04-30'
),
(
  'e1e2e3e4-0015-4000-a000-000000000015', 3,
  'd1d2d3d4-0004-4000-9000-000000000004',
  'Character Animation - Chihiro',
  'Animazione del personaggio principale Chihiro per tutte le scene. Acting e lip-sync.',
  'IN PROGRESS',
  'b1b2c3d4-0001-4000-b000-000000000001',
  200.00,
  '2025-11-01', '2026-05-31'
),
(
  'e1e2e3e4-0016-4000-a000-000000000016', 4,
  'd1d2d3d4-0004-4000-9000-000000000004',
  'Colonna Sonora - Arrangiamenti',
  'Arrangiamenti orchestrali per le 6 canzoni originali. Registrazione e mix.',
  'NEW',
  NULL,
  120.00,
  '2026-05-01', '2026-08-31'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Tweety & Sylvester Corti (5 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0017-4000-a000-000000000017', 1,
  'd1d2d3d4-0005-4000-9000-000000000005',
  'Character Design - Titti e Gatto Silvestro',
  'Redesign dei personaggi classici in chiave moderna. Model sheet, turnaround, expression sheet e prop design per entrambi.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  60.00,
  '2025-08-01', '2025-09-30'
),
(
  'e1e2e3e4-0018-4000-a000-000000000018', 2,
  'd1d2d3d4-0005-4000-9000-000000000005',
  'Storyboard 10 Corti',
  'Storyboard completi per tutti i 10 cortometraggi. Circa 50 scene per corto, stile slapstick classico.',
  'DONE',
  'b1b2c3d4-0003-4000-b000-000000000003',
  90.00,
  '2025-09-15', '2025-11-30'
),
(
  'e1e2e3e4-0019-4000-a000-000000000019', 3,
  'd1d2d3d4-0005-4000-9000-000000000005',
  'Animazione Corti 1-5',
  'Animazione 2D dei primi 5 cortometraggi. Key animation, in-between, clean-up e coloring. Stile retrò con colori saturi.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  140.00,
  '2025-12-01', '2026-03-31'
),
(
  'e1e2e3e4-0020-4000-a000-000000000020', 4,
  'd1d2d3d4-0005-4000-9000-000000000005',
  'Animazione Corti 6-10',
  'Animazione 2D dei corti 6-10. Stesse specifiche tecniche della prima tranche.',
  'IN PROGRESS',
  'b1b2c3d4-0004-4000-b000-000000000004',
  140.00,
  '2026-01-15', '2026-05-15'
),
(
  'e1e2e3e4-0021-4000-a000-000000000021', 5,
  'd1d2d3d4-0005-4000-9000-000000000005',
  'Sound Design e Mix Finale',
  'Effetti sonori, foley e mix audio per tutti i 10 cortometraggi. Master per broadcast e streaming.',
  'NEW',
  NULL,
  50.00,
  '2026-04-01', '2026-06-30'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Gli Incredibili Missioni Segrete (5 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0022-4000-a000-000000000022', 1,
  'd1d2d3d4-0006-4000-9000-000000000006',
  'Concept Art Personaggi',
  'Concept art per i nuovi villain e i costumi aggiornati della famiglia Parr. 30 tavole con varianti.',
  'DONE',
  'b1b2c3d4-0003-4000-b000-000000000003',
  70.00,
  '2025-07-15', '2025-09-30'
),
(
  'e1e2e3e4-0023-4000-a000-000000000023', 2,
  'd1d2d3d4-0006-4000-9000-000000000006',
  'Modellazione 3D - Famiglia Parr',
  'Modellazione e rigging di Mr. Incredible, Elastigirl, Violetta, Flash e Jack-Jack. Setup per animazione stilizzata.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  120.00,
  '2025-10-01', '2026-02-28'
),
(
  'e1e2e3e4-0024-4000-a000-000000000024', 3,
  'd1d2d3d4-0006-4000-9000-000000000006',
  'Rigging e Setup Animazione',
  'Rigging avanzato con facial setup e cloth simulation. Rig personalizzati per i superpoteri di ogni personaggio.',
  'IN PROGRESS',
  'b1b2c3d4-0004-4000-b000-000000000004',
  80.00,
  '2025-12-01', '2026-03-31'
),
(
  'e1e2e3e4-0025-4000-a000-000000000025', 4,
  'd1d2d3d4-0006-4000-9000-000000000006',
  'Layout Episodio Pilota',
  'Layout 3D e previsualizzazione del pilota "Operazione Nocturn". Camera work, blocking e timing.',
  'NEW',
  'b1b2c3d4-0003-4000-b000-000000000003',
  60.00,
  '2026-03-01', '2026-05-31'
),
(
  'e1e2e3e4-0026-4000-a000-000000000026', 5,
  'd1d2d3d4-0006-4000-9000-000000000006',
  'Rendering e Lighting',
  'Setup illuminazione e rendering per tutti gli episodi. Look development NPR (Non-Photorealistic Rendering).',
  'NEW',
  NULL,
  90.00,
  '2026-06-01', '2026-08-31'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Totoro Serie TV (4 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0027-4000-a000-000000000027', 1,
  'd1d2d3d4-0007-4000-9000-000000000007',
  'Concept Art - Foresta Magica',
  'Concept art per gli ambienti della foresta magica e il villaggio. 25 tavole in stile acquerello tradizionale giapponese.',
  'DONE',
  'b1b2c3d4-0003-4000-b000-000000000003',
  80.00,
  '2025-09-01', '2025-11-15'
),
(
  'e1e2e3e4-0028-4000-a000-000000000028', 2,
  'd1d2d3d4-0007-4000-9000-000000000007',
  'Character Design Serie TV',
  'Adattamento dei personaggi per il formato serie. Satsuki, Mei, Totoro e i Kodama. Model sheet e expression sheet.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  100.00,
  '2025-11-01', '2026-02-28'
),
(
  'e1e2e3e4-0029-4000-a000-000000000029', 3,
  'd1d2d3d4-0007-4000-9000-000000000007',
  'Storyboard Episodi 1-6',
  'Storyboard completi per la prima stagione. 150 scene per episodio, ritmo contemplativo tipico Ghibli.',
  'NEW',
  'b1b2c3d4-0004-4000-b000-000000000004',
  120.00,
  '2026-02-01', '2026-05-31'
),
(
  'e1e2e3e4-0030-4000-a000-000000000030', 4,
  'd1d2d3d4-0007-4000-9000-000000000007',
  'Animazione Tradizionale Ep. 1',
  'Animazione tradizionale su carta del primo episodio. Key animation, in-between, clean-up con pennello digitale.',
  'NEW',
  NULL,
  180.00,
  '2026-04-01', '2026-08-31'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Il Re Leone Prequel (6 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0031-4000-a000-000000000031', 1,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'Sceneggiatura Completa',
  'Sceneggiatura del film completo (90 min). Tre atti: infanzia di Mufasa, la sfida per la Rupe dei Re, l''ascesa a sovrano.',
  'DONE',
  'b1b2c3d4-0001-4000-b000-000000000001',
  50.00,
  '2025-06-01', '2025-08-31'
),
(
  'e1e2e3e4-0032-4000-a000-000000000032', 2,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'Storyboard Atto I',
  'Storyboard completo del primo atto (30 min). 200 scene, focus sull''infanzia nella savana.',
  'DONE',
  'b1b2c3d4-0003-4000-b000-000000000003',
  80.00,
  '2025-09-01', '2025-11-30'
),
(
  'e1e2e3e4-0033-4000-a000-000000000033', 3,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'Character Design - Cuccioli',
  'Design di Mufasa cucciolo, Taka (giovane Scar) e 6 personaggi secondari. Model sheet, turnaround e age progression.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  90.00,
  '2025-11-01', '2026-02-28'
),
(
  'e1e2e3e4-0034-4000-a000-000000000034', 4,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'Background Art - Savana',
  'Fondali digitali per tutti gli ambienti: savana, Rupe dei Re, foresta, fiume. Palette calda con tramonti africani.',
  'IN PROGRESS',
  'b1b2c3d4-0003-4000-b000-000000000003',
  110.00,
  '2025-12-01', '2026-04-30'
),
(
  'e1e2e3e4-0035-4000-a000-000000000035', 5,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'Animazione Atto I',
  'Animazione 2D completa del primo atto. Key animation, acting, effetti speciali (polvere, acqua, fuoco).',
  'NEW',
  'b1b2c3d4-0004-4000-b000-000000000004',
  200.00,
  '2026-03-01', '2026-07-31'
),
(
  'e1e2e3e4-0036-4000-a000-000000000036', 6,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'Colonna Sonora Originale',
  'Composizione colonna sonora con influenze africane. 12 brani + 3 canzoni originali con testi in italiano e swahili.',
  'NEW',
  NULL,
  150.00,
  '2026-06-01', '2026-09-30'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Alice nel Paese delle Meraviglie 2.0 (4 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0037-4000-a000-000000000037', 1,
  'd1d2d3d4-0009-4000-9000-000000000009',
  'Concept Art - Paese delle Meraviglie',
  'Concept art per gli ambienti fantastici: giardino delle carte, foresta dei funghi, palazzo della Regina. Stile psichedelico-vittoriano.',
  'IN PROGRESS',
  'b1b2c3d4-0003-4000-b000-000000000003',
  70.00,
  '2025-11-15', '2026-02-28'
),
(
  'e1e2e3e4-0038-4000-a000-000000000038', 2,
  'd1d2d3d4-0009-4000-9000-000000000009',
  'Character Design - Alice e Stregatto',
  'Design dei personaggi principali con varianti AR. Alice, Stregatto, Cappellaio Matto, Regina di Cuori.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  60.00,
  '2025-12-01', '2026-03-15'
),
(
  'e1e2e3e4-0039-4000-a000-000000000039', 3,
  'd1d2d3d4-0009-4000-9000-000000000009',
  'Storyboard Interattivo',
  'Storyboard con branching narrativo per le scelte interattive. 4 percorsi narrativi, 100 scene per percorso.',
  'NEW',
  'b1b2c3d4-0004-4000-b000-000000000004',
  100.00,
  '2026-03-01', '2026-06-30'
),
(
  'e1e2e3e4-0040-4000-a000-000000000040', 4,
  'd1d2d3d4-0009-4000-9000-000000000009',
  'Prototipo Animazione AR',
  'Prototipo tecnico dell''esperienza AR. Integrazione animazione 2D con ambienti reali tramite ARKit/ARCore.',
  'NEW',
  NULL,
  130.00,
  '2026-05-01', '2026-09-30'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - SpongeBob Il Grande Film Italiano (5 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0041-4000-a000-000000000041', 1,
  'd1d2d3d4-0010-4000-9000-000000000010',
  'Sceneggiatura Film',
  'Sceneggiatura originale: SpongeBob e Patrick in vacanza in Italia. 75 minuti, ambientato tra Venezia, Roma e la Costiera.',
  'DONE',
  'b1b2c3d4-0001-4000-b000-000000000001',
  40.00,
  '2025-08-01', '2025-10-15'
),
(
  'e1e2e3e4-0042-4000-a000-000000000042', 2,
  'd1d2d3d4-0010-4000-9000-000000000010',
  'Character Design - Versione Italiana',
  'Adattamento dei personaggi con costumi italiani. SpongeBob gondoliere, Patrick gladiatore, Sandy archeologa.',
  'IN PROGRESS',
  'b1b2c3d4-0003-4000-b000-000000000003',
  75.00,
  '2025-10-15', '2026-02-15'
),
(
  'e1e2e3e4-0043-4000-a000-000000000043', 3,
  'd1d2d3d4-0010-4000-9000-000000000010',
  'Storyboard Film Completo',
  'Storyboard dell''intero film. 600 scene con note di regia e timing per le gag comiche.',
  'IN PROGRESS',
  'b1b2c3d4-0004-4000-b000-000000000004',
  130.00,
  '2025-11-01', '2026-03-31'
),
(
  'e1e2e3e4-0044-4000-a000-000000000044', 4,
  'd1d2d3d4-0010-4000-9000-000000000010',
  'Animazione Atto I',
  'Animazione completa del primo atto (25 min). Sequenze a Bikini Bottom e arrivo in Italia.',
  'NEW',
  'b1b2c3d4-0002-4000-b000-000000000002',
  180.00,
  '2026-03-01', '2026-07-31'
),
(
  'e1e2e3e4-0045-4000-a000-000000000045', 5,
  'd1d2d3d4-0010-4000-9000-000000000010',
  'Doppiaggio e Lip-Sync Italiano',
  'Doppiaggio italiano con voci originali. Lip-sync, adattamento dialoghi e mix audio finale.',
  'NEW',
  NULL,
  60.00,
  '2026-06-01', '2026-08-31'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASK ETC (Estimate To Complete) - per tutti i task IN PROGRESS
-- ============================================================================

INSERT INTO public.task_etc (etc_id, task_id, company_id, etc_hours) VALUES
  -- Progetti originali
  ('f1f2f3f4-0001-4000-b000-000000000001', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 85.00),  -- Bugs Animazione Ep.1
  ('f1f2f3f4-0002-4000-b000-000000000002', 'e1e2e3e4-0004-4000-a000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 60.00),  -- Bugs Background Art
  ('f1f2f3f4-0003-4000-b000-000000000003', 'e1e2e3e4-0006-4000-a000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 95.00),  -- Road Runner VFX
  ('f1f2f3f4-0004-4000-b000-000000000004', 'e1e2e3e4-0010-4000-a000-000000000010', 'a1b2c3d4-0001-4000-a000-000000000001', 20.00),  -- Toy Story Sceneggiatura
  ('f1f2f3f4-0005-4000-b000-000000000005', 'e1e2e3e4-0014-4000-a000-000000000014', 'a1b2c3d4-0001-4000-a000-000000000001', 100.00), -- Ghibli Coreografie
  ('f1f2f3f4-0006-4000-b000-000000000006', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 120.00), -- Ghibli Chihiro
  -- Nuovi progetti
  ('f1f2f3f4-0007-4000-b000-000000000007', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 65.00),  -- Tweety Anim 1-5
  ('f1f2f3f4-0008-4000-b000-000000000008', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 95.00),  -- Tweety Anim 6-10
  ('f1f2f3f4-0009-4000-b000-000000000009', 'e1e2e3e4-0023-4000-a000-000000000023', 'a1b2c3d4-0001-4000-a000-000000000001', 45.00),  -- Incredibili Modellazione
  ('f1f2f3f4-0010-4000-b000-000000000010', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 35.00),  -- Incredibili Rigging
  ('f1f2f3f4-0011-4000-b000-000000000011', 'e1e2e3e4-0028-4000-a000-000000000028', 'a1b2c3d4-0001-4000-a000-000000000001', 40.00),  -- Totoro Character Design
  ('f1f2f3f4-0012-4000-b000-000000000012', 'e1e2e3e4-0033-4000-a000-000000000033', 'a1b2c3d4-0001-4000-a000-000000000001', 35.00),  -- Simba Character Design
  ('f1f2f3f4-0013-4000-b000-000000000013', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 55.00),  -- Simba Background Art
  ('f1f2f3f4-0014-4000-b000-000000000014', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 25.00),  -- Alice Concept Art
  ('f1f2f3f4-0015-4000-b000-000000000015', 'e1e2e3e4-0038-4000-a000-000000000038', 'a1b2c3d4-0001-4000-a000-000000000001', 20.00),  -- Alice Character Design
  ('f1f2f3f4-0016-4000-b000-000000000016', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 30.00),  -- SpongeBob Char Design
  ('f1f2f3f4-0017-4000-b000-000000000017', 'e1e2e3e4-0043-4000-a000-000000000043', 'a1b2c3d4-0001-4000-a000-000000000001', 60.00)   -- SpongeBob Storyboard
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASK TIMESHEETS - ore lavorate (gennaio-febbraio 2026)
-- ============================================================================

INSERT INTO public.task_timesheet (timesheet_id, task_id, company_id, user_id, timesheet_date, total_hours, details) VALUES

-- ── Luna Disegni ────────────────────────────────────────────────────────────
-- Animazione Ep.1 Bugs Bunny
('aa000001-0001-4000-aa00-000000000001', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-09', 8.00, 'Key animation scene 12-15'),
('aa000001-0002-4000-aa00-000000000002', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-10', 7.50, 'Key animation scene 16-18'),
('aa000001-0003-4000-aa00-000000000003', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-11', 8.00, 'In-between e clean-up scene 1-5'),
('aa000001-0004-4000-aa00-000000000004', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-12', 6.00, 'Coloring scene 1-3'),
('aa000001-0005-4000-aa00-000000000005', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-13', 8.00, 'Key animation scene 19-22'),
-- Esplosioni ACME
('aa000001-0006-4000-aa00-000000000006', 'e1e2e3e4-0006-4000-a000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-16', 4.00, 'Simulazione esplosione ACME Rocket'),
('aa000001-0007-4000-aa00-000000000007', 'e1e2e3e4-0006-4000-a000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-17', 8.00, 'Compositing shot 1-5 esplosioni'),
('aa000001-0008-4000-aa00-000000000008', 'e1e2e3e4-0006-4000-a000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-18', 7.00, 'Particelle e debris shot 6-10'),
-- Coreografie Animate (Ghibli)
('aa000001-0009-4000-aa00-000000000009', 'e1e2e3e4-0014-4000-a000-000000000014', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-19', 8.00, 'Animazione coreografia "Il Volo degli Spiriti"'),
('aa000001-0010-4000-aa00-000000000010', 'e1e2e3e4-0014-4000-a000-000000000014', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-20', 6.50, 'Timing musicale e lip-sync numero 3'),
-- Tweety Animazione Corti 1-5
('aa000001-0021-4000-aa00-000000000021', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-19', 8.00, 'Key animation corto 1 scene 1-12'),
('aa000001-0022-4000-aa00-000000000022', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-20', 7.00, 'Key animation corto 1 scene 13-25'),
('aa000001-0023-4000-aa00-000000000023', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-21', 8.00, 'In-between corto 1'),
('aa000001-0024-4000-aa00-000000000024', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-22', 6.50, 'Clean-up e coloring corto 1'),
('aa000001-0025-4000-aa00-000000000025', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-02', 8.00, 'Key animation corto 2 scene 1-15'),
('aa000001-0026-4000-aa00-000000000026', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-03', 7.50, 'Key animation corto 2 scene 16-30'),
-- Incredibili Modellazione 3D
('aa000001-0027-4000-aa00-000000000027', 'e1e2e3e4-0023-4000-a000-000000000023', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-04', 8.00, 'Modellazione Mr. Incredible base mesh'),
('aa000001-0028-4000-aa00-000000000028', 'e1e2e3e4-0023-4000-a000-000000000023', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-05', 7.00, 'Dettagli e UV mapping Mr. Incredible'),
('aa000001-0029-4000-aa00-000000000029', 'e1e2e3e4-0023-4000-a000-000000000023', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-06', 8.00, 'Modellazione Elastigirl'),
-- Simba Character Design
('aa000001-0030-4000-aa00-000000000030', 'e1e2e3e4-0033-4000-a000-000000000033', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-26', 8.00, 'Mufasa cucciolo - schizzi e proporzioni'),
('aa000001-0031-4000-aa00-000000000031', 'e1e2e3e4-0033-4000-a000-000000000033', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-27', 6.00, 'Mufasa cucciolo - model sheet finale'),
('aa000001-0032-4000-aa00-000000000032', 'e1e2e3e4-0033-4000-a000-000000000033', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-28', 7.50, 'Taka (giovane Scar) - schizzi iniziali'),

-- ── Marco Animato (PM) ─────────────────────────────────────────────────────
-- Background Art Bugs Bunny
('aa000001-0011-4000-aa00-000000000011', 'e1e2e3e4-0004-4000-a000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-09', 3.00, 'Revisione fondali episodio 1'),
('aa000001-0012-4000-aa00-000000000012', 'e1e2e3e4-0004-4000-a000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-10', 4.00, 'Fondali tana di Bugs'),
('aa000001-0013-4000-aa00-000000000013', 'e1e2e3e4-0004-4000-a000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-11', 2.50, 'Color palette città'),
-- Sceneggiatura Toy Story
('aa000001-0014-4000-aa00-000000000014', 'e1e2e3e4-0010-4000-a000-000000000010', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-12', 5.00, 'Revisione sceneggiatura ep. 2'),
('aa000001-0015-4000-aa00-000000000015', 'e1e2e3e4-0010-4000-a000-000000000010', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-13', 6.00, 'Dialoghi ep. 3 prima stesura'),
-- Character Animation Chihiro
('aa000001-0016-4000-aa00-000000000016', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-16', 7.00, 'Acting test scena della stazione'),
('aa000001-0017-4000-aa00-000000000017', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-17', 8.00, 'Animazione scena incontro Haku'),
('aa000001-0018-4000-aa00-000000000018', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-18', 4.00, 'Lip-sync canzone "Oltre il Fiume"'),
('aa000001-0019-4000-aa00-000000000019', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-19', 6.00, 'Revisione e correzioni scene 1-8'),
('aa000001-0020-4000-aa00-000000000020', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-20', 5.00, 'Clean-up animazione scena finale'),

-- ── Stella Colori ───────────────────────────────────────────────────────────
-- Simba Background Art Savana
('aa000001-0033-4000-aa00-000000000033', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-02', 7.00, 'Fondale tramonto sulla savana - bozzetto'),
('aa000001-0034-4000-aa00-000000000034', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-03', 8.00, 'Fondale tramonto - versione finale con palette calda'),
('aa000001-0035-4000-aa00-000000000035', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-04', 6.00, 'Rupe dei Re - vista panoramica giorno'),
('aa000001-0036-4000-aa00-000000000036', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-11', 8.00, 'Rupe dei Re - variante notte stellata'),
('aa000001-0037-4000-aa00-000000000037', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-17', 7.00, 'Foresta di acacie e fiume'),
-- Alice Concept Art
('aa000001-0038-4000-aa00-000000000038', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-05', 8.00, 'Giardino delle carte - concept iniziale'),
('aa000001-0039-4000-aa00-000000000039', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-06', 7.50, 'Foresta dei funghi giganti - palette colori'),
('aa000001-0040-4000-aa00-000000000040', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-12', 7.00, 'Palazzo della Regina di Cuori - interni'),
('aa000001-0041-4000-aa00-000000000041', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-16', 6.50, 'Tavolo del tè - set design psichedelico'),
('aa000001-0042-4000-aa00-000000000042', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-20', 8.00, 'Tana del Bianconiglio - varianti AR'),
-- SpongeBob Character Design
('aa000001-0043-4000-aa00-000000000043', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-09', 8.00, 'SpongeBob gondoliere - schizzi iniziali'),
('aa000001-0044-4000-aa00-000000000044', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-10', 6.00, 'Patrick gladiatore - model sheet'),
('aa000001-0045-4000-aa00-000000000045', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-13', 8.00, 'Sandy archeologa - turnaround completo'),
('aa000001-0046-4000-aa00-000000000046', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-18', 5.00, 'Squiddi in versione pizzaiolo napoletano'),
('aa000001-0047-4000-aa00-000000000047', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-19', 7.00, 'Expression sheet tutti i personaggi'),

-- ── Riko Montaggio ──────────────────────────────────────────────────────────
-- Tweety Animazione Corti 6-10
('aa000001-0048-4000-aa00-000000000048', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-02', 8.00, 'Key animation corto 6 - inseguimento in cucina'),
('aa000001-0049-4000-aa00-000000000049', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-03', 7.00, 'In-between e timing corto 6'),
('aa000001-0050-4000-aa00-000000000050', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-09', 8.00, 'Key animation corto 7 - il piano del gatto'),
('aa000001-0051-4000-aa00-000000000051', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-10', 7.50, 'Clean-up e coloring corto 6'),
('aa000001-0052-4000-aa00-000000000052', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-17', 8.00, 'Key animation corto 8 - la gabbietta'),
('aa000001-0053-4000-aa00-000000000053', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-20', 7.00, 'In-between corto 7 e 8'),
-- Incredibili Rigging
('aa000001-0054-4000-aa00-000000000054', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-04', 8.00, 'Rig base Mr. Incredible - skeleton e IK'),
('aa000001-0055-4000-aa00-000000000055', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-05', 6.50, 'Facial rig Mr. Incredible - blend shapes'),
('aa000001-0056-4000-aa00-000000000056', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-11', 8.00, 'Rig Elastigirl - stretch setup avanzato'),
('aa000001-0057-4000-aa00-000000000057', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-16', 7.00, 'Cloth simulation costume Violetta'),
('aa000001-0058-4000-aa00-000000000058', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-19', 5.50, 'Rig Flash - speed blur setup'),
-- SpongeBob Storyboard
('aa000001-0059-4000-aa00-000000000059', 'e1e2e3e4-0043-4000-a000-000000000043', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-06', 8.00, 'Storyboard sequenza apertura Bikini Bottom'),
('aa000001-0060-4000-aa00-000000000060', 'e1e2e3e4-0043-4000-a000-000000000043', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-12', 6.00, 'Storyboard arrivo a Venezia - gondola chase'),
('aa000001-0061-4000-aa00-000000000061', 'e1e2e3e4-0043-4000-a000-000000000043', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-13', 8.00, 'Storyboard Colosseo - scena gladiatori'),
('aa000001-0062-4000-aa00-000000000062', 'e1e2e3e4-0043-4000-a000-000000000043', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-18', 7.00, 'Storyboard Costiera Amalfitana - finale')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- ESTIMATES
-- ============================================================================

-- Stima 1: Daffy Duck Serie Web (Looney, DRAFT)
INSERT INTO public.estimate (
  estimate_id, client_id, title, description, status,
  pct_analysis, pct_development, pct_internal_test, pct_uat,
  pct_release, pct_pm, pct_startup, pct_documentation,
  contingency_percentage, created_by, project_managers
) VALUES (
  'ee000001-0001-4000-ae00-000000000001',
  'c1c2c3d4-0001-4000-8000-000000000001',
  'Daffy Duck - Nuova Serie Web',
  'Stima per la produzione di una serie web di 6 episodi dedicata a Daffy Duck. Format breve (7 min/ep), distribuzione streaming.',
  'DRAFT',
  15.00, 40.00, 5.00, 10.00,
  2.00, 10.00, 12.00, 6.00,
  15.00,
  'b1b2c3d4-0001-4000-b000-000000000001',
  ARRAY['b1b2c3d4-0001-4000-b000-000000000001']::uuid[]
)
ON CONFLICT DO NOTHING;

-- Stima 2: Ponyo Serie Streaming (Ghibli, DRAFT)
INSERT INTO public.estimate (
  estimate_id, client_id, title, description, status,
  pct_analysis, pct_development, pct_internal_test, pct_uat,
  pct_release, pct_pm, pct_startup, pct_documentation,
  contingency_percentage, created_by, project_managers
) VALUES (
  'ee000001-0002-4000-ae00-000000000002',
  'c1c2c3d4-0003-4000-8000-000000000003',
  'Ponyo - Serie Streaming',
  'Stima per adattamento di Ponyo in serie streaming. 8 episodi da 20 minuti, animazione tradizionale con fondali digitali.',
  'DRAFT',
  12.00, 42.00, 5.00, 12.00,
  2.00, 8.00, 13.00, 6.00,
  18.00,
  'b1b2c3d4-0001-4000-b000-000000000001',
  ARRAY['b1b2c3d4-0001-4000-b000-000000000001']::uuid[]
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ESTIMATE TASKS - Daffy Duck
-- ============================================================================

INSERT INTO public.estimate_task (
  estimate_task_id, estimate_id, activity_name, activity_detail, hours_development_input,
  hours_analysis, hours_development, hours_internal_test, hours_uat,
  hours_release, hours_pm, hours_startup, hours_documentation, hours_contingency
) VALUES
(
  'ef000001-0001-4000-af00-000000000001',
  'ee000001-0001-4000-ae00-000000000001',
  'Character Design Daffy Duck',
  'Redesign di Daffy Duck per il formato web. Model sheet, expression sheet e prop design.',
  40.00,
  6.00, 40.00, 2.00, 4.00, 0.80, 4.00, 4.80, 2.40, 9.00
),
(
  'ef000001-0002-4000-af00-000000000002',
  'ee000001-0001-4000-ae00-000000000001',
  'Storyboard 6 Episodi',
  'Storyboard completi per tutti i 6 episodi. Circa 90 scene per episodio.',
  80.00,
  12.00, 80.00, 4.00, 8.00, 1.60, 8.00, 9.60, 4.80, 18.06
),
(
  'ef000001-0003-4000-af00-000000000003',
  'ee000001-0001-4000-ae00-000000000001',
  'Animazione Completa',
  'Animazione 2D di tutti gli episodi. Key, in-between, clean-up e coloring.',
  200.00,
  30.00, 200.00, 10.00, 20.00, 4.00, 20.00, 24.00, 12.00, 45.00
),
(
  'ef000001-0004-4000-af00-000000000004',
  'ee000001-0001-4000-ae00-000000000001',
  'Background e Ambienti',
  'Fondali digitali per tutti gli ambienti. Stile cartoon classico.',
  60.00,
  9.00, 60.00, 3.00, 6.00, 1.20, 6.00, 7.20, 3.60, 13.50
),
(
  'ef000001-0005-4000-af00-000000000005',
  'ee000001-0001-4000-ae00-000000000001',
  'Post-Produzione e Delivery',
  'Compositing, color correction, encoding per piattaforme streaming. QC finale.',
  30.00,
  4.50, 30.00, 1.50, 3.00, 0.60, 3.00, 3.60, 1.80, 6.75
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ESTIMATE TASKS - Ponyo Serie Streaming
-- ============================================================================

INSERT INTO public.estimate_task (
  estimate_task_id, estimate_id, activity_name, activity_detail, hours_development_input,
  hours_analysis, hours_development, hours_internal_test, hours_uat,
  hours_release, hours_pm, hours_startup, hours_documentation, hours_contingency
) VALUES
(
  'ef000001-0006-4000-af00-000000000006',
  'ee000001-0002-4000-ae00-000000000002',
  'Concept Art Ambienti Marini',
  'Concept art per il mondo sottomarino e il villaggio costiero. 30 tavole con varianti stagionali.',
  50.00,
  6.00, 50.00, 2.50, 6.00, 1.00, 4.00, 6.50, 3.00, 9.00
),
(
  'ef000001-0007-4000-af00-000000000007',
  'ee000001-0002-4000-ae00-000000000002',
  'Character Design Serie',
  'Adattamento Ponyo, Sosuke e personaggi marini per formato serie. Model sheet e expression sheet completi.',
  35.00,
  4.20, 35.00, 1.75, 4.20, 0.70, 2.80, 4.55, 2.10, 6.30
),
(
  'ef000001-0008-4000-af00-000000000008',
  'ee000001-0002-4000-ae00-000000000002',
  'Animazione 8 Episodi',
  'Animazione tradizionale per tutti gli episodi. Key animation, in-between, clean-up. Stile acquerello animato.',
  250.00,
  30.00, 250.00, 12.50, 30.00, 5.00, 20.00, 32.50, 15.00, 45.00
),
(
  'ef000001-0009-4000-af00-000000000009',
  'ee000001-0002-4000-ae00-000000000002',
  'Post-Produzione e Consegna',
  'Compositing con fondali digitali, color grading, encoding multi-piattaforma. QC e master.',
  40.00,
  4.80, 40.00, 2.00, 4.80, 0.80, 3.20, 5.20, 2.40, 7.20
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- HOLIDAY CALENDAR (festività italiane 2026 per Toon Studios)
-- ============================================================================

INSERT INTO public.holiday_calendar (holiday_id, name, date, is_recurring, company_id) VALUES
  ('cc000001-0001-4000-8c00-000000000001', 'Capodanno',          '2026-01-01', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0002-4000-8c00-000000000002', 'Epifania',           '2026-01-06', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0003-4000-8c00-000000000003', 'Pasquetta',          '2026-04-06', false, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0004-4000-8c00-000000000004', 'Festa della Liberazione', '2026-04-25', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0005-4000-8c00-000000000005', 'Festa del Lavoro',   '2026-05-01', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0006-4000-8c00-000000000006', 'Festa della Repubblica', '2026-06-02', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0007-4000-8c00-000000000007', 'Ferragosto',         '2026-08-15', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0008-4000-8c00-000000000008', 'Tutti i Santi',      '2026-11-01', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0009-4000-8c00-000000000009', 'Immacolata',         '2026-12-08', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0010-4000-8c00-000000000010', 'Natale',             '2026-12-25', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0011-4000-8c00-000000000011', 'Santo Stefano',      '2026-12-26', true, 'a1b2c3d4-0001-4000-a000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- USER TIME OFF PLAN (ferie e permessi pianificati)
-- ============================================================================

INSERT INTO public.user_time_off_plan (time_off_id, user_id, company_id, time_off_type_id, date, hours, details) VALUES
-- Luna Disegni - ferie estive (1 settimana agosto)
('dd000001-0001-4000-9d00-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-03', 8.00, 'Ferie estive'),
('dd000001-0002-4000-9d00-000000000002', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-04', 8.00, 'Ferie estive'),
('dd000001-0003-4000-9d00-000000000003', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-05', 8.00, 'Ferie estive'),
('dd000001-0004-4000-9d00-000000000004', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-06', 8.00, 'Ferie estive'),
('dd000001-0005-4000-9d00-000000000005', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-07', 8.00, 'Ferie estive'),
-- Marco Animato - permesso + ferie
('dd000001-0006-4000-9d00-000000000006', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'OTHER', '2026-03-06', 4.00, 'Visita medica'),
('dd000001-0007-4000-9d00-000000000007', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-10', 8.00, 'Ferie estive'),
('dd000001-0008-4000-9d00-000000000008', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-11', 8.00, 'Ferie estive'),
('dd000001-0009-4000-9d00-000000000009', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-12', 8.00, 'Ferie estive'),
('dd000001-0010-4000-9d00-000000000010', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-13', 8.00, 'Ferie estive'),
('dd000001-0011-4000-9d00-000000000011', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-14', 8.00, 'Ferie estive'),
-- Stella Colori - ferie estive (1 settimana agosto)
('dd000001-0012-4000-9d00-000000000012', 'b1b2c3d4-0003-4000-b000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-10', 8.00, 'Ferie estive'),
('dd000001-0013-4000-9d00-000000000013', 'b1b2c3d4-0003-4000-b000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-11', 8.00, 'Ferie estive'),
('dd000001-0014-4000-9d00-000000000014', 'b1b2c3d4-0003-4000-b000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-12', 8.00, 'Ferie estive'),
('dd000001-0015-4000-9d00-000000000015', 'b1b2c3d4-0003-4000-b000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-13', 8.00, 'Ferie estive'),
('dd000001-0016-4000-9d00-000000000016', 'b1b2c3d4-0003-4000-b000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-14', 8.00, 'Ferie estive'),
-- Riko Montaggio - permesso + malattia + ferie
('dd000001-0017-4000-9d00-000000000017', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'OTHER', '2026-03-13', 4.00, 'Appuntamento'),
('dd000001-0018-4000-9d00-000000000018', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'OTHER', '2026-01-15', 8.00, 'Influenza'),
('dd000001-0019-4000-9d00-000000000019', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'OTHER', '2026-01-16', 8.00, 'Influenza'),
('dd000001-0020-4000-9d00-000000000020', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-17', 8.00, 'Ferie estive'),
('dd000001-0021-4000-9d00-000000000021', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-18', 8.00, 'Ferie estive'),
('dd000001-0022-4000-9d00-000000000022', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-19', 8.00, 'Ferie estive'),
('dd000001-0023-4000-9d00-000000000023', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-20', 8.00, 'Ferie estive'),
('dd000001-0024-4000-9d00-000000000024', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-21', 8.00, 'Ferie estive')
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- RIEPILOGO DATI INSERITI
-- ============================================================================
--
-- AZIENDA:  Toon Studios S.r.l. (TOON)
--
-- UTENTI (4):
--   Marco Animato  | PM   | marco.animato@toonstudios.it  | pwd: admin123
--   Luna Disegni   | USER | luna.disegni@toonstudios.it   | pwd: admin123
--   Stella Colori  | USER | stella.colori@toonstudios.it  | pwd: admin123
--   Riko Montaggio | USER | riko.montaggio@toonstudios.it | pwd: admin123
--
-- CLIENTI (5):
--   Looney Productions        (#EF4444 rosso)
--   Pixar Dreams Entertainment (#3B82F6 blu)
--   Ghibli Italia S.p.A.      (#10B981 verde)
--   Disney Classics Italia     (#F59E0B giallo)
--   Nickelodeon Europe S.r.l.  (#8B5CF6 viola)
--
-- PROGETTI (10):
--   TOON-LOONEY-BUGS   → Bugs Bunny - Il Reboot (PROJECT, 5 task)
--   TOON-LOONEY-ROAD   → Road Runner - Effetti Speciali (TM, 3 task)
--   TOON-LOONEY-TWEETY → Tweety & Sylvester - Corti Animati (PROJECT, 5 task)
--   TOON-PIXAR-TOYS    → Toy Story - Le Avventure di Forky (PROJECT, 4 task)
--   TOON-PIXAR-INCRE   → Gli Incredibili - Missioni Segrete (PROJECT, 5 task)
--   TOON-GHIBLI-SPIRIT → La Città Incantata - Musical (PROJECT, 4 task)
--   TOON-GHIBLI-TOTORO → Il Mio Vicino Totoro - Serie TV (TM, 4 task)
--   TOON-DISNEY-SIMBA  → Il Re Leone - Le Origini di Mufasa (PROJECT, 6 task)
--   TOON-DISNEY-ALICE  → Alice nel Paese delle Meraviglie 2.0 (TM, 4 task)
--   TOON-NICK-SPONGE   → SpongeBob - Il Grande Film Italiano (PROJECT, 5 task)
--
-- TASK: 45 totali (11 DONE, 17 IN PROGRESS, 17 NEW)
-- TIMESHEET: 62 entries (gennaio-febbraio 2026, tutti e 4 gli utenti)
-- ETC: 17 stime per i task in progress
-- STIME: 2 (Daffy Duck 5 attività, Ponyo 4 attività)
-- FESTIVITÀ: 11 (calendario italiano 2026)
-- TIME OFF: 24 giorni pianificati (VACATION, OTHER)
-- ============================================================================
