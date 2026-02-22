-- ============================================================================
-- Pleasy - SEED DEMO: Toon Studios S.r.l.
-- Azienda di produzione cartoni animati (dati per screenshot)
-- ============================================================================
-- Password per tutti gli utenti: admin123
-- Eseguire DOPO schema.sql e i seed di lookup
-- ============================================================================

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

-- ============================================================================
-- CLIENTS
-- ============================================================================

-- Client 1: Looney Productions
INSERT INTO public.client (client_id, company_id, client_key, client_name, client_description, status_id, color)
VALUES (
  'c1c2c3d4-0001-4000-c000-000000000001',
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
  'c1c2c3d4-0002-4000-c000-000000000002',
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
  'c1c2c3d4-0003-4000-c000-000000000003',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'GHIBLI',
  'Ghibli Italia S.p.A.',
  'Divisione italiana dello studio di animazione giapponese',
  'ACTIVE',
  '#10B981'
)
ON CONFLICT ON CONSTRAINT uk_client_company_key DO NOTHING;

-- ============================================================================
-- PROJECTS
-- ============================================================================

-- Progetto 1: Bugs Bunny Reboot (Looney, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0001-4000-d000-000000000001',
  'c1c2c3d4-0001-4000-c000-000000000001',
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
  'd1d2d3d4-0002-4000-d000-000000000002',
  'c1c2c3d4-0001-4000-c000-000000000001',
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
  'd1d2d3d4-0003-4000-d000-000000000003',
  'c1c2c3d4-0002-4000-c000-000000000002',
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
  'd1d2d3d4-0004-4000-d000-000000000004',
  'c1c2c3d4-0003-4000-c000-000000000003',
  'SPIRIT',
  'La Città Incantata - Musical Animato',
  'Adattamento musical animato de La Città Incantata per il mercato europeo.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- ============================================================================
-- PROJECT MANAGERS (Marco Animato è PM di tutti i progetti)
-- ============================================================================

INSERT INTO public.project_manager (project_id, user_id) VALUES
  ('d1d2d3d4-0001-4000-d000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0002-4000-d000-000000000002', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0003-4000-d000-000000000003', 'b1b2c3d4-0001-4000-b000-000000000001'),
  ('d1d2d3d4-0004-4000-d000-000000000004', 'b1b2c3d4-0001-4000-b000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASK SEQUENCES
-- ============================================================================

INSERT INTO public.task_sequence (project_id, last_task_number) VALUES
  ('d1d2d3d4-0001-4000-d000-000000000001', 5),
  ('d1d2d3d4-0002-4000-d000-000000000002', 3),
  ('d1d2d3d4-0003-4000-d000-000000000003', 4),
  ('d1d2d3d4-0004-4000-d000-000000000004', 4)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Bugs Bunny Reboot (5 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0001-4000-e000-000000000001', 1,
  'd1d2d3d4-0001-4000-d000-000000000001',
  'Character Design - Bugs Bunny',
  'Redesign del personaggio principale con stile moderno mantenendo i tratti iconici. Include model sheet, turnaround e expression sheet.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  80.00,
  '2025-09-01', '2025-10-15'
),
(
  'e1e2e3e4-0002-4000-e000-000000000002', 2,
  'd1d2d3d4-0001-4000-d000-000000000001',
  'Storyboard Episodio Pilota',
  'Storyboard completo per il primo episodio "La Grande Fuga dalla Tana". 180 scene, 22 minuti.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  120.00,
  '2025-10-01', '2025-11-30'
),
(
  'e1e2e3e4-0003-4000-e000-000000000003', 3,
  'd1d2d3d4-0001-4000-d000-000000000001',
  'Animazione Episodio 1',
  'Animazione 2D completa dell''episodio pilota. Key animation, in-between, clean-up e coloring.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  200.00,
  '2025-12-01', '2026-03-31'
),
(
  'e1e2e3e4-0004-4000-e000-000000000004', 4,
  'd1d2d3d4-0001-4000-d000-000000000001',
  'Background Art - Stagione 1',
  'Creazione di tutti i fondali per la prima stagione. Stile acquerello digitale con palette vivace.',
  'IN PROGRESS',
  'b1b2c3d4-0001-4000-b000-000000000001',
  150.00,
  '2025-11-15', '2026-04-30'
),
(
  'e1e2e3e4-0005-4000-e000-000000000005', 5,
  'd1d2d3d4-0001-4000-d000-000000000001',
  'Compositing e Post-Produzione',
  'Compositing finale, color correction e output per broadcast.',
  'TODO',
  NULL,
  100.00,
  '2026-04-01', '2026-06-30'
);

-- ============================================================================
-- TASKS - Road Runner VFX (3 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0006-4000-e000-000000000006', 1,
  'd1d2d3d4-0002-4000-d000-000000000002',
  'Esplosioni ACME - VFX',
  'Effetti speciali per tutte le esplosioni dei prodotti ACME. 45 shot da completare con simulazione particellare.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  160.00,
  '2025-11-01', '2026-03-15'
),
(
  'e1e2e3e4-0007-4000-e000-000000000007', 2,
  'd1d2d3d4-0002-4000-d000-000000000002',
  'Dust Trail - Effetto Polvere',
  'Creazione dell''effetto polvere tipico del Road Runner in corsa. Simulazione fluidi e compositing.',
  'TODO',
  'b1b2c3d4-0002-4000-b000-000000000002',
  90.00,
  '2026-01-15', '2026-04-30'
),
(
  'e1e2e3e4-0008-4000-e000-000000000008', 3,
  'd1d2d3d4-0002-4000-d000-000000000002',
  'Canyon Environment - Matte Painting',
  'Matte painting digitali per gli ambienti del canyon. 12 scenari unici con varianti di illuminazione.',
  'TODO',
  NULL,
  70.00,
  '2026-02-01', '2026-05-15'
);

-- ============================================================================
-- TASKS - Toy Story Spinoff (4 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0009-4000-e000-000000000009', 1,
  'd1d2d3d4-0003-4000-d000-000000000003',
  'Modellazione 3D - Forky e Amici',
  'Modellazione e rigging di Forky, Knifey e 4 nuovi personaggi secondari.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  100.00,
  '2025-08-01', '2025-10-30'
),
(
  'e1e2e3e4-0010-4000-e000-000000000010', 2,
  'd1d2d3d4-0003-4000-d000-000000000003',
  'Sceneggiatura Ep. 1-4',
  'Scrittura delle sceneggiature per i primi 4 episodi con revisioni e approvazione cliente.',
  'IN PROGRESS',
  'b1b2c3d4-0001-4000-b000-000000000001',
  60.00,
  '2025-10-01', '2026-01-31'
),
(
  'e1e2e3e4-0011-4000-e000-000000000011', 3,
  'd1d2d3d4-0003-4000-d000-000000000003',
  'Layout e Previz Episodio 1',
  'Layout 3D e previsualizzazione completa del primo episodio. Camera work e blocking.',
  'TODO',
  'b1b2c3d4-0002-4000-b000-000000000002',
  80.00,
  '2026-02-01', '2026-04-30'
),
(
  'e1e2e3e4-0012-4000-e000-000000000012', 4,
  'd1d2d3d4-0003-4000-d000-000000000003',
  'Texturing e Shading',
  'Texturing e shading di tutti gli asset 3D. Stile stilizzato coerente con l''universo Toy Story.',
  'TODO',
  NULL,
  110.00,
  '2026-03-01', '2026-06-30'
);

-- ============================================================================
-- TASKS - La Città Incantata Musical (4 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0013-4000-e000-000000000013', 1,
  'd1d2d3d4-0004-4000-d000-000000000004',
  'Concept Art - Mondo degli Spiriti',
  'Concept art per tutti gli ambienti del mondo degli spiriti. 20 tavole in stile acquerello tradizionale.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  90.00,
  '2025-07-01', '2025-09-30'
),
(
  'e1e2e3e4-0014-4000-e000-000000000014', 2,
  'd1d2d3d4-0004-4000-d000-000000000004',
  'Coreografie Animate',
  'Animazione delle sequenze musicali. 6 numeri musicali con coreografie sincronizzate.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  180.00,
  '2025-10-01', '2026-04-30'
),
(
  'e1e2e3e4-0015-4000-e000-000000000015', 3,
  'd1d2d3d4-0004-4000-d000-000000000004',
  'Character Animation - Chihiro',
  'Animazione del personaggio principale Chihiro per tutte le scene. Acting e lip-sync.',
  'IN PROGRESS',
  'b1b2c3d4-0001-4000-b000-000000000001',
  200.00,
  '2025-11-01', '2026-05-31'
),
(
  'e1e2e3e4-0016-4000-e000-000000000016', 4,
  'd1d2d3d4-0004-4000-d000-000000000004',
  'Colonna Sonora - Arrangiamenti',
  'Arrangiamenti orchestrali per le 6 canzoni originali. Registrazione e mix.',
  'NEW',
  NULL,
  120.00,
  '2026-05-01', '2026-08-31'
);

-- ============================================================================
-- TASK ETC (Estimate To Complete) - per i task IN PROGRESS
-- ============================================================================

INSERT INTO public.task_etc (etc_id, task_id, company_id, etc_hours) VALUES
  ('f1f2f3f4-0001-4000-f000-000000000001', 'e1e2e3e4-0003-4000-e000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 85.00),
  ('f1f2f3f4-0002-4000-f000-000000000002', 'e1e2e3e4-0004-4000-e000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 60.00),
  ('f1f2f3f4-0003-4000-f000-000000000003', 'e1e2e3e4-0006-4000-e000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 95.00),
  ('f1f2f3f4-0004-4000-f000-000000000004', 'e1e2e3e4-0010-4000-e000-000000000010', 'a1b2c3d4-0001-4000-a000-000000000001', 20.00),
  ('f1f2f3f4-0005-4000-f000-000000000005', 'e1e2e3e4-0014-4000-e000-000000000014', 'a1b2c3d4-0001-4000-a000-000000000001', 100.00),
  ('f1f2f3f4-0006-4000-f000-000000000006', 'e1e2e3e4-0015-4000-e000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 120.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASK TIMESHEETS - ore lavorate (ultime settimane)
-- ============================================================================

INSERT INTO public.task_timesheet (timesheet_id, task_id, company_id, user_id, timesheet_date, total_hours, details) VALUES
-- Luna Disegni - Animazione Ep.1 Bugs Bunny
('aa000001-0001-4000-aa00-000000000001', 'e1e2e3e4-0003-4000-e000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-09', 8.00, 'Key animation scene 12-15'),
('aa000001-0002-4000-aa00-000000000002', 'e1e2e3e4-0003-4000-e000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-10', 7.50, 'Key animation scene 16-18'),
('aa000001-0003-4000-aa00-000000000003', 'e1e2e3e4-0003-4000-e000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-11', 8.00, 'In-between e clean-up scene 1-5'),
('aa000001-0004-4000-aa00-000000000004', 'e1e2e3e4-0003-4000-e000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-12', 6.00, 'Coloring scene 1-3'),
('aa000001-0005-4000-aa00-000000000005', 'e1e2e3e4-0003-4000-e000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-13', 8.00, 'Key animation scene 19-22'),

-- Luna Disegni - Esplosioni ACME
('aa000001-0006-4000-aa00-000000000006', 'e1e2e3e4-0006-4000-e000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-16', 4.00, 'Simulazione esplosione ACME Rocket'),
('aa000001-0007-4000-aa00-000000000007', 'e1e2e3e4-0006-4000-e000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-17', 8.00, 'Compositing shot 1-5 esplosioni'),
('aa000001-0008-4000-aa00-000000000008', 'e1e2e3e4-0006-4000-e000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-18', 7.00, 'Particelle e debris shot 6-10'),

-- Luna Disegni - Coreografie Animate (Ghibli)
('aa000001-0009-4000-aa00-000000000009', 'e1e2e3e4-0014-4000-e000-000000000014', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-19', 8.00, 'Animazione coreografia "Il Volo degli Spiriti"'),
('aa000001-0010-4000-aa00-000000000010', 'e1e2e3e4-0014-4000-e000-000000000014', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-20', 6.50, 'Timing musicale e lip-sync numero 3'),

-- Marco Animato (PM) - Background Art Bugs Bunny
('aa000001-0011-4000-aa00-000000000011', 'e1e2e3e4-0004-4000-e000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-09', 3.00, 'Revisione fondali episodio 1'),
('aa000001-0012-4000-aa00-000000000012', 'e1e2e3e4-0004-4000-e000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-10', 4.00, 'Fondali tana di Bugs'),
('aa000001-0013-4000-aa00-000000000013', 'e1e2e3e4-0004-4000-e000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-11', 2.50, 'Color palette città'),

-- Marco Animato (PM) - Sceneggiatura Toy Story
('aa000001-0014-4000-aa00-000000000014', 'e1e2e3e4-0010-4000-e000-000000000010', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-12', 5.00, 'Revisione sceneggiatura ep. 2'),
('aa000001-0015-4000-aa00-000000000015', 'e1e2e3e4-0010-4000-e000-000000000010', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-13', 6.00, 'Dialoghi ep. 3 prima stesura'),

-- Marco Animato (PM) - Character Animation Chihiro
('aa000001-0016-4000-aa00-000000000016', 'e1e2e3e4-0015-4000-e000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-16', 7.00, 'Acting test scena della stazione'),
('aa000001-0017-4000-aa00-000000000017', 'e1e2e3e4-0015-4000-e000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-17', 8.00, 'Animazione scena incontro Haku'),
('aa000001-0018-4000-aa00-000000000018', 'e1e2e3e4-0015-4000-e000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-18', 4.00, 'Lip-sync canzone "Oltre il Fiume"'),
('aa000001-0019-4000-aa00-000000000019', 'e1e2e3e4-0015-4000-e000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-19', 6.00, 'Revisione e correzioni scene 1-8'),
('aa000001-0020-4000-aa00-000000000020', 'e1e2e3e4-0015-4000-e000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-20', 5.00, 'Clean-up animazione scena finale')

ON CONFLICT DO NOTHING;

-- ============================================================================
-- ESTIMATE - Nuova stima per Looney Productions
-- ============================================================================

INSERT INTO public.estimate (
  estimate_id, client_id, title, description, status,
  pct_analysis, pct_development, pct_internal_test, pct_uat,
  pct_release, pct_pm, pct_startup, pct_documentation,
  contingency_percentage, created_by, project_managers
) VALUES (
  'ee000001-0001-4000-ee00-000000000001',
  'c1c2c3d4-0001-4000-c000-000000000001',
  'Daffy Duck - Nuova Serie Web',
  'Stima per la produzione di una serie web di 6 episodi dedicata a Daffy Duck. Format breve (7 min/ep), distribuzione streaming.',
  'DRAFT',
  15.00, 40.00, 5.00, 10.00,
  2.00, 10.00, 12.00, 6.00,
  15.00,
  'b1b2c3d4-0001-4000-b000-000000000001',
  ARRAY['b1b2c3d4-0001-4000-b000-000000000001']::uuid[]
);

-- ============================================================================
-- ESTIMATE TASKS
-- ============================================================================

INSERT INTO public.estimate_task (
  estimate_task_id, estimate_id, activity_name, activity_detail, hours_development_input,
  hours_analysis, hours_development, hours_internal_test, hours_uat,
  hours_release, hours_pm, hours_startup, hours_documentation, hours_contingency
) VALUES
(
  'ef000001-0001-4000-ef00-000000000001',
  'ee000001-0001-4000-ee00-000000000001',
  'Character Design Daffy Duck',
  'Redesign di Daffy Duck per il formato web. Model sheet, expression sheet e prop design.',
  40.00,
  6.00, 40.00, 2.00, 4.00, 0.80, 4.00, 4.80, 2.40, 9.00
),
(
  'ef000001-0002-4000-ef00-000000000002',
  'ee000001-0001-4000-ee00-000000000001',
  'Storyboard 6 Episodi',
  'Storyboard completi per tutti i 6 episodi. Circa 90 scene per episodio.',
  80.00,
  12.00, 80.00, 4.00, 8.00, 1.60, 8.00, 9.60, 4.80, 18.06
),
(
  'ef000001-0003-4000-ef00-000000000003',
  'ee000001-0001-4000-ee00-000000000001',
  'Animazione Completa',
  'Animazione 2D di tutti gli episodi. Key, in-between, clean-up e coloring.',
  200.00,
  30.00, 200.00, 10.00, 20.00, 4.00, 20.00, 24.00, 12.00, 45.00
),
(
  'ef000001-0004-4000-ef00-000000000004',
  'ee000001-0001-4000-ee00-000000000001',
  'Background e Ambienti',
  'Fondali digitali per tutti gli ambienti. Stile cartoon classico.',
  60.00,
  9.00, 60.00, 3.00, 6.00, 1.20, 6.00, 7.20, 3.60, 13.50
),
(
  'ef000001-0005-4000-ef00-000000000005',
  'ee000001-0001-4000-ee00-000000000001',
  'Post-Produzione e Delivery',
  'Compositing, color correction, encoding per piattaforme streaming. QC finale.',
  30.00,
  4.50, 30.00, 1.50, 3.00, 0.60, 3.00, 3.60, 1.80, 6.75
);

-- ============================================================================
-- HOLIDAY CALENDAR (festività italiane 2026 per Toon Studios)
-- ============================================================================

INSERT INTO public.holiday_calendar (holiday_id, name, date, is_recurring, company_id) VALUES
  ('cc000001-0001-4000-cc00-000000000001', 'Capodanno',          '2026-01-01', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0002-4000-cc00-000000000002', 'Epifania',           '2026-01-06', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0003-4000-cc00-000000000003', 'Pasquetta',          '2026-04-06', false, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0004-4000-cc00-000000000004', 'Festa della Liberazione', '2026-04-25', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0005-4000-cc00-000000000005', 'Festa del Lavoro',   '2026-05-01', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0006-4000-cc00-000000000006', 'Festa della Repubblica', '2026-06-02', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0007-4000-cc00-000000000007', 'Ferragosto',         '2026-08-15', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0008-4000-cc00-000000000008', 'Tutti i Santi',      '2026-11-01', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0009-4000-cc00-000000000009', 'Immacolata',         '2026-12-08', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0010-4000-cc00-000000000010', 'Natale',             '2026-12-25', true, 'a1b2c3d4-0001-4000-a000-000000000001'),
  ('cc000001-0011-4000-cc00-000000000011', 'Santo Stefano',      '2026-12-26', true, 'a1b2c3d4-0001-4000-a000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- USER TIME OFF PLAN (ferie pianificate)
-- ============================================================================

INSERT INTO public.user_time_off_plan (time_off_id, user_id, company_id, time_off_type_id, date, hours, details) VALUES
-- Luna Disegni - ferie estive
('dd000001-0001-4000-dd00-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'FERIE', '2026-08-03', 8.00, 'Ferie estive'),
('dd000001-0002-4000-dd00-000000000002', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'FERIE', '2026-08-04', 8.00, 'Ferie estive'),
('dd000001-0003-4000-dd00-000000000003', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'FERIE', '2026-08-05', 8.00, 'Ferie estive'),
('dd000001-0004-4000-dd00-000000000004', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'FERIE', '2026-08-06', 8.00, 'Ferie estive'),
('dd000001-0005-4000-dd00-000000000005', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'FERIE', '2026-08-07', 8.00, 'Ferie estive'),
-- Marco Animato - permesso
('dd000001-0006-4000-dd00-000000000006', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'PERMESSO', '2026-03-06', 4.00, 'Visita medica'),
-- Marco Animato - ferie
('dd000001-0007-4000-dd00-000000000007', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'FERIE', '2026-08-10', 8.00, 'Ferie estive'),
('dd000001-0008-4000-dd00-000000000008', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'FERIE', '2026-08-11', 8.00, 'Ferie estive'),
('dd000001-0009-4000-dd00-000000000009', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'FERIE', '2026-08-12', 8.00, 'Ferie estive'),
('dd000001-0010-4000-dd00-000000000010', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'FERIE', '2026-08-13', 8.00, 'Ferie estive'),
('dd000001-0011-4000-dd00-000000000011', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'FERIE', '2026-08-14', 8.00, 'Ferie estive')
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- RIEPILOGO DATI INSERITI
-- ============================================================================
--
-- AZIENDA:  Toon Studios S.r.l. (TOON)
--
-- UTENTI:
--   Marco Animato  | PM   | marco.animato@toonstudios.it  | pwd: admin123
--   Luna Disegni   | USER | luna.disegni@toonstudios.it   | pwd: admin123
--
-- CLIENTI:
--   Looney Productions       (#EF4444 rosso)
--   Pixar Dreams Entertainment (#3B82F6 blu)
--   Ghibli Italia S.p.A.     (#10B981 verde)
--
-- PROGETTI (4):
--   TOON-LOONEY-BUGS   → Bugs Bunny - Il Reboot (PROJECT, 5 task)
--   TOON-LOONEY-ROAD   → Road Runner - Effetti Speciali (TM, 3 task)
--   TOON-PIXAR-TOYS    → Toy Story - Le Avventure di Forky (PROJECT, 4 task)
--   TOON-GHIBLI-SPIRIT → La Città Incantata - Musical (PROJECT, 4 task)
--
-- TASK: 16 totali (4 DONE, 6 IN PROGRESS, 5 TODO, 1 NEW)
-- TIMESHEET: 20 entries (settimana 9-20 feb 2026)
-- ETC: 6 stime per i task in progress
-- STIMA: "Daffy Duck - Nuova Serie Web" (DRAFT, 5 attività)
-- FESTIVITÀ: 11 (calendario italiano 2026)
-- FERIE/PERMESSI: 11 giorni pianificati
-- ============================================================================
