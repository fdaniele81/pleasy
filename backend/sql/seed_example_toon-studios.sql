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
-- "Paperopoly S.r.l." — una software house fittizia di Paperopoli
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
-- ┌──────────────────────┬───────┬─────────────────────────────────────┬─────────────────┐
-- │ Nome                 │ Ruolo │ Email                               │ Azienda         │
-- ├──────────────────────┼───────┼─────────────────────────────────────┼─────────────────┤
-- │ Topolino De' Topi    │ PM    │ topolino.detopi@paperopoly.it       │ Paperopoly      │
-- │ Paperino Paperinik   │ USER  │ paperino.paperinik@paperopoly.it    │ Paperopoly      │
-- │ Pippo De' Pippis     │ USER  │ pippo.depippis@paperopoly.it        │ Paperopoly      │
-- │ Minni Topetti        │ USER  │ minni.topetti@paperopoly.it         │ Paperopoly      │
-- └──────────────────────┴───────┴─────────────────────────────────────┴─────────────────┘
-- N.B. L'utente ADMIN (admin@system.local) viene creato da schema.sql
--
-- ============================================================================

-- Chiude eventuali transazioni fallite rimaste aperte
ROLLBACK;

BEGIN;

-- ============================================================================
-- COMPANY: Paperopoly S.r.l.
-- ============================================================================

INSERT INTO public.company (company_id, company_key, legal_name, vat_number, status_id)
VALUES ('a1b2c3d4-0001-4000-a000-000000000001', 'PPOLY', 'Paperopoly S.r.l.', 'IT12345678901', 'ACTIVE')
ON CONFLICT (company_key) DO NOTHING;

-- ============================================================================
-- USERS
-- ============================================================================
-- Password: admin123 → $2b$10$CkAm1XpjTk9hrVRdQs9dh.UU9nvdylxH7tK9mUtfiP0L5ilVAoy7q

-- PM: Topolino De' Topi
INSERT INTO public.users (user_id, company_id, email, password_hash, role_id, status_id, full_name)
VALUES (
  'b1b2c3d4-0001-4000-b000-000000000001',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'topolino.detopi@paperopoly.it',
  '$2b$10$CkAm1XpjTk9hrVRdQs9dh.UU9nvdylxH7tK9mUtfiP0L5ilVAoy7q',
  'PM',
  'ACTIVE',
  'Topolino De'' Topi'
)
ON CONFLICT (email) DO NOTHING;

-- USER: Paperino Paperinik
INSERT INTO public.users (user_id, company_id, email, password_hash, role_id, status_id, full_name)
VALUES (
  'b1b2c3d4-0002-4000-b000-000000000002',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'paperino.paperinik@paperopoly.it',
  '$2b$10$CkAm1XpjTk9hrVRdQs9dh.UU9nvdylxH7tK9mUtfiP0L5ilVAoy7q',
  'USER',
  'ACTIVE',
  'Paperino Paperinik'
)
ON CONFLICT (email) DO NOTHING;

-- USER: Pippo De' Pippis
INSERT INTO public.users (user_id, company_id, email, password_hash, role_id, status_id, full_name)
VALUES (
  'b1b2c3d4-0003-4000-b000-000000000003',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'pippo.depippis@paperopoly.it',
  '$2b$10$CkAm1XpjTk9hrVRdQs9dh.UU9nvdylxH7tK9mUtfiP0L5ilVAoy7q',
  'USER',
  'ACTIVE',
  'Pippo De'' Pippis'
)
ON CONFLICT (email) DO NOTHING;

-- USER: Minni Topetti
INSERT INTO public.users (user_id, company_id, email, password_hash, role_id, status_id, full_name)
VALUES (
  'b1b2c3d4-0004-4000-b000-000000000004',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'minni.topetti@paperopoly.it',
  '$2b$10$CkAm1XpjTk9hrVRdQs9dh.UU9nvdylxH7tK9mUtfiP0L5ilVAoy7q',
  'USER',
  'ACTIVE',
  'Minni Topetti'
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- CLIENTS
-- ============================================================================

-- Client 1: Deposito De' Paperoni (Zio Paperone)
INSERT INTO public.client (client_id, company_id, client_key, client_name, client_description, status_id, color)
VALUES (
  'c1c2c3d4-0001-4000-8000-000000000001',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'PERON',
  'Deposito De'' Paperoni S.p.A.',
  'Holding finanziaria di Zio Paperone, gestione patrimonio e investimenti a Paperopoli',
  'ACTIVE',
  '#EF4444'
)
ON CONFLICT ON CONSTRAINT uk_client_company_key DO NOTHING;

-- Client 2: Archimede Lab (Archimede Pitagorico)
INSERT INTO public.client (client_id, company_id, client_key, client_name, client_description, status_id, color)
VALUES (
  'c1c2c3d4-0002-4000-8000-000000000002',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'ARCHI',
  'Archimede Lab S.r.l.',
  'Laboratorio di ricerca e sviluppo di Archimede Pitagorico, invenzioni e brevetti',
  'ACTIVE',
  '#3B82F6'
)
ON CONFLICT ON CONSTRAINT uk_client_company_key DO NOTHING;

-- Client 3: Banda Bassotti Inc.
INSERT INTO public.client (client_id, company_id, client_key, client_name, client_description, status_id, color)
VALUES (
  'c1c2c3d4-0003-4000-8000-000000000003',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'BANDA',
  'Banda Bassotti Inc.',
  'Agenzia di sicurezza e penetration testing (ex rapinatori riciclati)',
  'ACTIVE',
  '#10B981'
)
ON CONFLICT ON CONSTRAINT uk_client_company_key DO NOTHING;

-- Client 4: Commissario Basettoni
INSERT INTO public.client (client_id, company_id, client_key, client_name, client_description, status_id, color)
VALUES (
  'c1c2c3d4-0004-4000-8000-000000000004',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'BASET',
  'Questura di Topolinia',
  'Questura centrale di Topolinia, Commissario Basettoni - progetti di digitalizzazione',
  'ACTIVE',
  '#F59E0B'
)
ON CONFLICT ON CONSTRAINT uk_client_company_key DO NOTHING;

-- Client 5: Gambadilegno Trasporti
INSERT INTO public.client (client_id, company_id, client_key, client_name, client_description, status_id, color)
VALUES (
  'c1c2c3d4-0005-4000-8000-000000000005',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'GAMBA',
  'Gambadilegno Trasporti S.r.l.',
  'Compagnia di trasporti marittimi e logistica portuale di Pietro Gambadilegno',
  'ACTIVE',
  '#8B5CF6'
)
ON CONFLICT ON CONSTRAINT uk_client_company_key DO NOTHING;

-- ============================================================================
-- PROJECTS (10 totali)
-- ============================================================================

-- Progetto 1: Caveau Digitale (Deposito, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0001-4000-9000-000000000001',
  'c1c2c3d4-0001-4000-8000-000000000001',
  'CAVEAU',
  'Caveau Digitale - Sistema Contabile',
  'Sistema di contabilità e gestione patrimoniale per il Deposito di Zio Paperone. Monete, lingotti e fatture in un unico portale.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 2: Monitoraggio Numero Uno (Deposito, TM, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0002-4000-9000-000000000002',
  'c1c2c3d4-0001-4000-8000-000000000001',
  'NUNO',
  'Monitoraggio Numero Uno',
  'Sistema IoT di sorveglianza per la Numero Uno (la prima moneta di Paperone). Sensori, allarmi e dashboard real-time. Time & Material.',
  'ACTIVE',
  'TM',
  false
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 3: Inventarium (Archimede, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0003-4000-9000-000000000003',
  'c1c2c3d4-0002-4000-8000-000000000002',
  'INVENT',
  'Inventarium - Catalogo Brevetti',
  'Piattaforma web per catalogare e gestire le invenzioni di Archimede. Ricerca brevetti, stato prototipi e storico esperimenti.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 4: Allarme Bassotti (Banda Bassotti, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0004-4000-9000-000000000004',
  'c1c2c3d4-0003-4000-8000-000000000003',
  'ALARM',
  'Allarme Bassotti - Pen Testing Platform',
  'Piattaforma di penetration testing e vulnerability assessment. I Bassotti mettono a frutto la loro esperienza nel "settore sicurezza".',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 5: Deposito Cloud (Deposito, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0005-4000-9000-000000000005',
  'c1c2c3d4-0001-4000-8000-000000000001',
  'CLOUD',
  'Deposito Cloud - Migrazione Infrastruttura',
  'Migrazione dell''intera infrastruttura IT del Deposito su cloud. 10 servizi, 3 ambienti, CI/CD completo.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 6: Robottino Helper (Archimede, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0006-4000-9000-000000000006',
  'c1c2c3d4-0002-4000-8000-000000000002',
  'ROBOT',
  'Robottino Helper - App di Controllo',
  'App mobile per il controllo remoto dell''Edicolino (il robottino aiutante di Archimede). Comandi vocali, telemetria e diagnostica.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 7: Sorveglianza Bassotti (Banda Bassotti, TM, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0007-4000-9000-000000000007',
  'c1c2c3d4-0003-4000-8000-000000000003',
  'SORV',
  'Sorveglianza Bassotti - CCTV Analytics',
  'Sistema di videosorveglianza con AI per analisi comportamentale. Integrazione con 50 telecamere esistenti. Time & Material.',
  'ACTIVE',
  'TM',
  false
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 8: Fascicolo Digitale (Questura, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0008-4000-9000-000000000008',
  'c1c2c3d4-0004-4000-8000-000000000004',
  'FASC',
  'Fascicolo Digitale - Gestione Indagini',
  'Digitalizzazione dei fascicoli investigativi della Questura di Topolinia. Workflow, scansioni OCR e ricerca full-text.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 9: Mappa Pattuglie (Questura, TM, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0009-4000-9000-000000000009',
  'c1c2c3d4-0004-4000-8000-000000000004',
  'PATT',
  'Mappa Pattuglie - Tracking GPS',
  'Sistema di tracking GPS delle pattuglie di Topolinia. Mappa real-time, ottimizzazione percorsi e storico interventi.',
  'ACTIVE',
  'TM',
  false
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- Progetto 10: Porto Digitale (Gambadilegno, PROJECT, ACTIVE)
INSERT INTO public.project (project_id, client_id, project_key, title, description, status_id, project_type_id, reconciliation_required)
VALUES (
  'd1d2d3d4-0010-4000-9000-000000000010',
  'c1c2c3d4-0005-4000-8000-000000000005',
  'PORTO',
  'Porto Digitale - Gestione Logistica',
  'Piattaforma di gestione logistica portuale per Gambadilegno Trasporti. Tracciamento container, sdoganamento e fatturazione.',
  'ACTIVE',
  'PROJECT',
  true
)
ON CONFLICT ON CONSTRAINT uk_project_client_key DO NOTHING;

-- ============================================================================
-- PROJECT MANAGERS (Topolino De' Topi è PM di tutti i progetti)
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
-- TASKS - Caveau Digitale (5 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, external_key, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0001-4000-a000-000000000001', 1,
  'd1d2d3d4-0001-4000-9000-000000000001',
  'JIRA-CAV-101',
  'Analisi Requisiti Contabili',
  'Raccolta requisiti con Zio Paperone per il modulo contabile. Interviste, analisi flussi monete/lingotti e mappatura processi esistenti.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  80.00,
  '2025-09-01', '2025-10-15'
),
(
  'e1e2e3e4-0002-4000-a000-000000000002', 2,
  'd1d2d3d4-0001-4000-9000-000000000001',
  'JIRA-CAV-102',
  'Database Schema e API Base',
  'Progettazione schema DB per il sistema contabile del Deposito. API REST per CRUD operazioni finanziarie e partita doppia.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  120.00,
  '2025-10-01', '2025-11-30'
),
(
  'e1e2e3e4-0003-4000-a000-000000000003', 3,
  'd1d2d3d4-0001-4000-9000-000000000001',
  'JIRA-CAV-103',
  'Frontend Dashboard Patrimonio',
  'Sviluppo dashboard React per visualizzazione patrimonio in tempo reale. Grafici, drill-down per valuta e report PDF.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  200.00,
  '2025-12-01', '2026-03-31'
),
(
  'e1e2e3e4-0004-4000-a000-000000000004', 4,
  'd1d2d3d4-0001-4000-9000-000000000001',
  'JIRA-CAV-104',
  'Modulo Fatturazione Elettronica',
  'Integrazione con SDI per fatturazione elettronica. Generazione XML, invio e ricezione notifiche.',
  'IN PROGRESS',
  'b1b2c3d4-0001-4000-b000-000000000001',
  150.00,
  '2025-11-15', '2026-04-30'
),
(
  'e1e2e3e4-0005-4000-a000-000000000005', 5,
  'd1d2d3d4-0001-4000-9000-000000000001',
  'JIRA-CAV-105',
  'Testing e Go-Live',
  'Test end-to-end, UAT con il team di Paperone, migrazione dati storici e deploy in produzione.',
  'NEW',
  NULL,
  100.00,
  '2026-04-01', '2026-06-30'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Monitoraggio Numero Uno (3 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, external_key, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0006-4000-a000-000000000006', 1,
  'd1d2d3d4-0002-4000-9000-000000000002',
  'JIRA-NUNO-201',
  'Setup Sensori IoT Teca',
  'Installazione e configurazione sensori temperatura, umidità e vibrazione sulla teca della Numero Uno. Protocollo MQTT.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  160.00,
  '2025-11-01', '2026-03-15'
),
(
  'e1e2e3e4-0007-4000-a000-000000000007', 2,
  'd1d2d3d4-0002-4000-9000-000000000002',
  'JIRA-NUNO-202',
  'Dashboard Allarmi Real-Time',
  'Dashboard web con mappa della teca, indicatori real-time e sistema di notifiche push/SMS per allarmi.',
  'NEW',
  'b1b2c3d4-0002-4000-b000-000000000002',
  90.00,
  '2026-01-15', '2026-04-30'
),
(
  'e1e2e3e4-0008-4000-a000-000000000008', 3,
  'd1d2d3d4-0002-4000-9000-000000000002',
  'JIRA-NUNO-203',
  'Integrazione Sistema Anti-Intrusione',
  'Collegamento con il sistema anti-intrusione esistente del Deposito. API di integrazione e failover automatico.',
  'NEW',
  NULL,
  70.00,
  '2026-02-01', '2026-05-15'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Inventarium (4 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, external_key, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0009-4000-a000-000000000009', 1,
  'd1d2d3d4-0003-4000-9000-000000000003',
  'JIRA-INV-301',
  'Modello Dati Brevetti',
  'Progettazione schema DB per catalogo invenzioni. Entità: brevetto, prototipo, componente, esperimento. Relazioni e storico versioni.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  100.00,
  '2025-08-01', '2025-10-30'
),
(
  'e1e2e3e4-0010-4000-a000-000000000010', 2,
  'd1d2d3d4-0003-4000-9000-000000000003',
  'JIRA-INV-302',
  'API Ricerca e Filtri Avanzati',
  'API full-text search con Elasticsearch per ricerca brevetti. Filtri per categoria, stato, data e inventore.',
  'IN PROGRESS',
  'b1b2c3d4-0001-4000-b000-000000000001',
  60.00,
  '2025-10-01', '2026-01-31'
),
(
  'e1e2e3e4-0011-4000-a000-000000000011', 3,
  'd1d2d3d4-0003-4000-9000-000000000003',
  'JIRA-INV-303',
  'Frontend Catalogo Web',
  'Interfaccia web React per consultazione e inserimento brevetti. Upload foto prototipi, timeline esperimenti.',
  'NEW',
  'b1b2c3d4-0002-4000-b000-000000000002',
  80.00,
  '2026-02-01', '2026-04-30'
),
(
  'e1e2e3e4-0012-4000-a000-000000000012', 4,
  'd1d2d3d4-0003-4000-9000-000000000003',
  'JIRA-INV-304',
  'Modulo Export e Reportistica',
  'Generazione report PDF/Excel per brevetti. Export per ufficio brevetti, statistiche e dashboard Archimede.',
  'NEW',
  NULL,
  110.00,
  '2026-03-01', '2026-06-30'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Allarme Bassotti (4 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, external_key, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0013-4000-a000-000000000013', 1,
  'd1d2d3d4-0004-4000-9000-000000000004',
  'JIRA-ALR-401',
  'Architettura Piattaforma Pen Test',
  'Design architetturale della piattaforma: sandbox isolate, orchestratore test, engine di scoring vulnerabilità.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  90.00,
  '2025-07-01', '2025-09-30'
),
(
  'e1e2e3e4-0014-4000-a000-000000000014', 2,
  'd1d2d3d4-0004-4000-9000-000000000004',
  'JIRA-ALR-402',
  'Engine Vulnerability Scanner',
  'Sviluppo dello scanner automatico di vulnerabilità. Integrazione con CVE database, port scanning e fingerprinting.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  180.00,
  '2025-10-01', '2026-04-30'
),
(
  'e1e2e3e4-0015-4000-a000-000000000015', 3,
  'd1d2d3d4-0004-4000-9000-000000000004',
  'JIRA-ALR-403',
  'Report e Compliance OWASP',
  'Modulo di reportistica automatica. Generazione report OWASP Top 10, remediation plan e tracking fix.',
  'IN PROGRESS',
  'b1b2c3d4-0001-4000-b000-000000000001',
  200.00,
  '2025-11-01', '2026-05-31'
),
(
  'e1e2e3e4-0016-4000-a000-000000000016', 4,
  'd1d2d3d4-0004-4000-9000-000000000004',
  'JIRA-ALR-404',
  'Portale Clienti e Scheduling',
  'Portale web per i clienti dei Bassotti: prenotazione pen test, visualizzazione risultati e storico assessment.',
  'NEW',
  NULL,
  120.00,
  '2026-05-01', '2026-08-31'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Deposito Cloud (5 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, external_key, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0017-4000-a000-000000000017', 1,
  'd1d2d3d4-0005-4000-9000-000000000005',
  'JIRA-CLD-501',
  'Assessment Infrastruttura Attuale',
  'Audit completo dei 10 servizi on-premise del Deposito. Mapping dipendenze, sizing e analisi costi cloud.',
  'DONE',
  'b1b2c3d4-0002-4000-b000-000000000002',
  60.00,
  '2025-08-01', '2025-09-30'
),
(
  'e1e2e3e4-0018-4000-a000-000000000018', 2,
  'd1d2d3d4-0005-4000-9000-000000000005',
  'JIRA-CLD-502',
  'Setup IaC e Pipeline CI/CD',
  'Infrastruttura come codice con Terraform. Pipeline CI/CD con GitHub Actions per i 3 ambienti (dev, staging, prod).',
  'DONE',
  'b1b2c3d4-0003-4000-b000-000000000003',
  90.00,
  '2025-09-15', '2025-11-30'
),
(
  'e1e2e3e4-0019-4000-a000-000000000019', 3,
  'd1d2d3d4-0005-4000-9000-000000000005',
  'JIRA-CLD-503',
  'Migrazione Database e Storage',
  'Migrazione PostgreSQL e object storage su cloud. Zero-downtime migration, test di consistenza dati e rollback plan.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  140.00,
  '2025-12-01', '2026-03-31'
),
(
  'e1e2e3e4-0020-4000-a000-000000000020', 4,
  'd1d2d3d4-0005-4000-9000-000000000005',
  'JIRA-CLD-504',
  'Migrazione Servizi Applicativi',
  'Containerizzazione e deploy su Kubernetes dei microservizi. Config management, secrets e health checks.',
  'IN PROGRESS',
  'b1b2c3d4-0004-4000-b000-000000000004',
  140.00,
  '2026-01-15', '2026-05-15'
),
(
  'e1e2e3e4-0021-4000-a000-000000000021', 5,
  'd1d2d3d4-0005-4000-9000-000000000005',
  'JIRA-CLD-505',
  'Monitoring e Decommissioning',
  'Setup monitoring con Grafana/Prometheus, alerting e dismissione infrastruttura on-premise dopo validazione.',
  'NEW',
  NULL,
  50.00,
  '2026-04-01', '2026-06-30'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Robottino Helper (5 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, external_key, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0022-4000-a000-000000000022', 1,
  'd1d2d3d4-0006-4000-9000-000000000006',
  'JIRA-ROB-601',
  'UX Design App Mobile',
  'Design UX/UI dell''app di controllo Edicolino. Wireframe, mockup e prototipo Figma con flussi comandi vocali.',
  'DONE',
  'b1b2c3d4-0003-4000-b000-000000000003',
  70.00,
  '2025-07-15', '2025-09-30'
),
(
  'e1e2e3e4-0023-4000-a000-000000000023', 2,
  'd1d2d3d4-0006-4000-9000-000000000006',
  'JIRA-ROB-602',
  'Backend Comandi e Telemetria',
  'API backend per invio comandi al robottino via BLE/WiFi. Raccolta dati telemetrici, storico posizioni e stato batteria.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  120.00,
  '2025-10-01', '2026-02-28'
),
(
  'e1e2e3e4-0024-4000-a000-000000000024', 3,
  'd1d2d3d4-0006-4000-9000-000000000006',
  'JIRA-ROB-603',
  'Modulo Comandi Vocali',
  'Integrazione speech-to-text per comandi vocali. Addestramento modello su vocabolario specifico di Archimede.',
  'IN PROGRESS',
  'b1b2c3d4-0004-4000-b000-000000000004',
  80.00,
  '2025-12-01', '2026-03-31'
),
(
  'e1e2e3e4-0025-4000-a000-000000000025', 4,
  'd1d2d3d4-0006-4000-9000-000000000006',
  'JIRA-ROB-604',
  'App Flutter Frontend',
  'Sviluppo app cross-platform Flutter. Controllo joystick virtuale, vista camera e pannello diagnostica.',
  'NEW',
  'b1b2c3d4-0003-4000-b000-000000000003',
  60.00,
  '2026-03-01', '2026-05-31'
),
(
  'e1e2e3e4-0026-4000-a000-000000000026', 5,
  'd1d2d3d4-0006-4000-9000-000000000006',
  'JIRA-ROB-605',
  'Beta Test e Rilascio Store',
  'Beta testing con Archimede, fix bug, pubblicazione su App Store e Play Store. Documentazione utente.',
  'NEW',
  NULL,
  90.00,
  '2026-06-01', '2026-08-31'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Sorveglianza Bassotti (4 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, external_key, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0027-4000-a000-000000000027', 1,
  'd1d2d3d4-0007-4000-9000-000000000007',
  'JIRA-SRV-701',
  'Analisi Requisiti CCTV',
  'Mappatura 50 telecamere esistenti, analisi protocolli (RTSP/ONVIF), definizione regole AI per analisi comportamentale.',
  'DONE',
  'b1b2c3d4-0003-4000-b000-000000000003',
  80.00,
  '2025-09-01', '2025-11-15'
),
(
  'e1e2e3e4-0028-4000-a000-000000000028', 2,
  'd1d2d3d4-0007-4000-9000-000000000007',
  'JIRA-SRV-702',
  'Pipeline Video Analytics',
  'Sviluppo pipeline di analisi video con modelli ML. Object detection, tracking persone e riconoscimento anomalie.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  100.00,
  '2025-11-01', '2026-02-28'
),
(
  'e1e2e3e4-0029-4000-a000-000000000029', 3,
  'd1d2d3d4-0007-4000-9000-000000000007',
  'JIRA-SRV-703',
  'Dashboard Operatore Sicurezza',
  'Dashboard web real-time con mappa telecamere, stream live, alert e replay eventi sospetti.',
  'NEW',
  'b1b2c3d4-0004-4000-b000-000000000004',
  120.00,
  '2026-02-01', '2026-05-31'
),
(
  'e1e2e3e4-0030-4000-a000-000000000030', 4,
  'd1d2d3d4-0007-4000-9000-000000000007',
  'JIRA-SRV-704',
  'Integrazione Sistema Allarmi',
  'Integrazione con impianto allarme e serrature smart. Automazione lockdown zone su eventi critici.',
  'NEW',
  NULL,
  180.00,
  '2026-04-01', '2026-08-31'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Fascicolo Digitale (6 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, external_key, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0031-4000-a000-000000000031', 1,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'JIRA-FSC-801',
  'Analisi Workflow Investigativo',
  'Mappatura del processo investigativo della Questura con Basettoni. Flussi documenti, stati fascicolo e permessi accesso.',
  'DONE',
  'b1b2c3d4-0001-4000-b000-000000000001',
  50.00,
  '2025-06-01', '2025-08-31'
),
(
  'e1e2e3e4-0032-4000-a000-000000000032', 2,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'JIRA-FSC-802',
  'Modulo OCR e Digitalizzazione',
  'Sviluppo pipeline OCR per scansione fascicoli cartacei. Riconoscimento testo, classificazione automatica e indicizzazione.',
  'DONE',
  'b1b2c3d4-0003-4000-b000-000000000003',
  80.00,
  '2025-09-01', '2025-11-30'
),
(
  'e1e2e3e4-0033-4000-a000-000000000033', 3,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'JIRA-FSC-803',
  'Backend Gestione Fascicoli',
  'API per CRUD fascicoli, gestione allegati, workflow stati e audit trail. Ricerca full-text con PostgreSQL tsvector.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  90.00,
  '2025-11-01', '2026-02-28'
),
(
  'e1e2e3e4-0034-4000-a000-000000000034', 4,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'JIRA-FSC-804',
  'Frontend Portale Investigatori',
  'Interfaccia web per gli investigatori. Ricerca fascicoli, timeline eventi, upload documenti e annotazioni.',
  'IN PROGRESS',
  'b1b2c3d4-0003-4000-b000-000000000003',
  110.00,
  '2025-12-01', '2026-04-30'
),
(
  'e1e2e3e4-0035-4000-a000-000000000035', 5,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'JIRA-FSC-805',
  'Modulo Reportistica Questura',
  'Report statistici per la Questura: fascicoli aperti/chiusi, tempi medi, performance per sezione.',
  'NEW',
  'b1b2c3d4-0004-4000-b000-000000000004',
  200.00,
  '2026-03-01', '2026-07-31'
),
(
  'e1e2e3e4-0036-4000-a000-000000000036', 6,
  'd1d2d3d4-0008-4000-9000-000000000008',
  'JIRA-FSC-806',
  'Sicurezza e Compliance GDPR',
  'Implementazione crittografia dati sensibili, gestione consensi, data retention policy e audit log per compliance GDPR.',
  'NEW',
  NULL,
  150.00,
  '2026-06-01', '2026-09-30'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Mappa Pattuglie (4 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, external_key, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0037-4000-a000-000000000037', 1,
  'd1d2d3d4-0009-4000-9000-000000000009',
  'JIRA-PAT-901',
  'Backend GPS e Geofencing',
  'API per raccolta posizioni GPS pattuglie, definizione zone geofencing e calcolo percorsi ottimali.',
  'IN PROGRESS',
  'b1b2c3d4-0003-4000-b000-000000000003',
  70.00,
  '2025-11-15', '2026-02-28'
),
(
  'e1e2e3e4-0038-4000-a000-000000000038', 2,
  'd1d2d3d4-0009-4000-9000-000000000009',
  'JIRA-PAT-902',
  'Mappa Real-Time Frontend',
  'Frontend React con mappa Leaflet/MapBox. Posizioni pattuglie in tempo reale, heatmap interventi e filtri temporali.',
  'IN PROGRESS',
  'b1b2c3d4-0002-4000-b000-000000000002',
  60.00,
  '2025-12-01', '2026-03-15'
),
(
  'e1e2e3e4-0039-4000-a000-000000000039', 3,
  'd1d2d3d4-0009-4000-9000-000000000009',
  'JIRA-PAT-903',
  'Storico Interventi e Analytics',
  'Modulo per storico percorsi, statistiche tempi di risposta e analisi copertura territoriale.',
  'NEW',
  'b1b2c3d4-0004-4000-b000-000000000004',
  100.00,
  '2026-03-01', '2026-06-30'
),
(
  'e1e2e3e4-0040-4000-a000-000000000040', 4,
  'd1d2d3d4-0009-4000-9000-000000000009',
  'JIRA-PAT-904',
  'App Mobile Agenti',
  'App mobile per agenti di pattuglia. Navigazione, segnalazione interventi e comunicazione con centrale.',
  'NEW',
  NULL,
  130.00,
  '2026-05-01', '2026-09-30'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASKS - Porto Digitale (5 task)
-- ============================================================================

INSERT INTO public.task (task_id, task_number, project_id, external_key, title, description, task_status_id, owner_id, budget, start_date, end_date) VALUES
(
  'e1e2e3e4-0041-4000-a000-000000000041', 1,
  'd1d2d3d4-0010-4000-9000-000000000010',
  'JIRA-PRT-1001',
  'Analisi Processi Portuali',
  'Mappatura processi logistici del porto di Gambadilegno: arrivo nave, scarico, stoccaggio, sdoganamento e spedizione.',
  'DONE',
  'b1b2c3d4-0001-4000-b000-000000000001',
  40.00,
  '2025-08-01', '2025-10-15'
),
(
  'e1e2e3e4-0042-4000-a000-000000000042', 2,
  'd1d2d3d4-0010-4000-9000-000000000010',
  'JIRA-PRT-1002',
  'Backend Tracking Container',
  'API per tracciamento container via codice RFID/QR. Stato spedizione, posizione in magazzino e storico movimentazioni.',
  'IN PROGRESS',
  'b1b2c3d4-0003-4000-b000-000000000003',
  75.00,
  '2025-10-15', '2026-02-15'
),
(
  'e1e2e3e4-0043-4000-a000-000000000043', 3,
  'd1d2d3d4-0010-4000-9000-000000000010',
  'JIRA-PRT-1003',
  'Portale Sdoganamento Digitale',
  'Interfaccia per pratiche doganali digitali. Upload documenti, validazione automatica e integrazione con Agenzia Dogane.',
  'IN PROGRESS',
  'b1b2c3d4-0004-4000-b000-000000000004',
  130.00,
  '2025-11-01', '2026-03-31'
),
(
  'e1e2e3e4-0044-4000-a000-000000000044', 4,
  'd1d2d3d4-0010-4000-9000-000000000010',
  'JIRA-PRT-1004',
  'Modulo Fatturazione e Tariffe',
  'Sistema di calcolo tariffe portuali, generazione fatture e integrazione con il Caveau Digitale di Paperone.',
  'NEW',
  'b1b2c3d4-0002-4000-b000-000000000002',
  180.00,
  '2026-03-01', '2026-07-31'
),
(
  'e1e2e3e4-0045-4000-a000-000000000045', 5,
  'd1d2d3d4-0010-4000-9000-000000000010',
  'JIRA-PRT-1005',
  'Dashboard Operativa Porto',
  'Dashboard real-time per il porto. Mappa banchine, stato navi, livelli magazzino e KPI operativi.',
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
  -- Caveau Digitale
  ('f1f2f3f4-0001-4000-b000-000000000001', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 85.00),  -- Frontend Dashboard Patrimonio
  ('f1f2f3f4-0002-4000-b000-000000000002', 'e1e2e3e4-0004-4000-a000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 60.00),  -- Modulo Fatturazione
  ('f1f2f3f4-0003-4000-b000-000000000003', 'e1e2e3e4-0006-4000-a000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 95.00),  -- Setup Sensori IoT
  ('f1f2f3f4-0004-4000-b000-000000000004', 'e1e2e3e4-0010-4000-a000-000000000010', 'a1b2c3d4-0001-4000-a000-000000000001', 20.00),  -- API Ricerca Brevetti
  ('f1f2f3f4-0005-4000-b000-000000000005', 'e1e2e3e4-0014-4000-a000-000000000014', 'a1b2c3d4-0001-4000-a000-000000000001', 100.00), -- Engine Vuln Scanner
  ('f1f2f3f4-0006-4000-b000-000000000006', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 120.00), -- Report OWASP
  -- Deposito Cloud / Robottino / Sorveglianza / Fascicolo / Pattuglie / Porto
  ('f1f2f3f4-0007-4000-b000-000000000007', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 65.00),  -- Migrazione DB Cloud
  ('f1f2f3f4-0008-4000-b000-000000000008', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 95.00),  -- Migrazione Servizi
  ('f1f2f3f4-0009-4000-b000-000000000009', 'e1e2e3e4-0023-4000-a000-000000000023', 'a1b2c3d4-0001-4000-a000-000000000001', 45.00),  -- Backend Comandi Robottino
  ('f1f2f3f4-0010-4000-b000-000000000010', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 35.00),  -- Comandi Vocali
  ('f1f2f3f4-0011-4000-b000-000000000011', 'e1e2e3e4-0028-4000-a000-000000000028', 'a1b2c3d4-0001-4000-a000-000000000001', 40.00),  -- Pipeline Video Analytics
  ('f1f2f3f4-0012-4000-b000-000000000012', 'e1e2e3e4-0033-4000-a000-000000000033', 'a1b2c3d4-0001-4000-a000-000000000001', 35.00),  -- Backend Fascicoli
  ('f1f2f3f4-0013-4000-b000-000000000013', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 55.00),  -- Frontend Investigatori
  ('f1f2f3f4-0014-4000-b000-000000000014', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 25.00),  -- Backend GPS Pattuglie
  ('f1f2f3f4-0015-4000-b000-000000000015', 'e1e2e3e4-0038-4000-a000-000000000038', 'a1b2c3d4-0001-4000-a000-000000000001', 20.00),  -- Mappa Real-Time
  ('f1f2f3f4-0016-4000-b000-000000000016', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 30.00),  -- Tracking Container
  ('f1f2f3f4-0017-4000-b000-000000000017', 'e1e2e3e4-0043-4000-a000-000000000043', 'a1b2c3d4-0001-4000-a000-000000000001', 60.00)   -- Portale Sdoganamento
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TIMESHEET SNAPSHOTS (submitted, per consentire la riconciliazione)
-- ============================================================================
-- Ogni utente ha uno snapshot submitted per il periodo gen-feb 2026.
-- I timesheet vengono poi collegati a questi snapshot via UPDATE.

INSERT INTO public.timesheet_snapshot (snapshot_id, user_id, company_id, is_submitted, submitted_at) VALUES
  ('aa000001-0001-4000-aa00-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', true, '2026-02-28 18:00:00'),  -- Paperino
  ('aa000001-0002-4000-aa00-000000000002', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', true, '2026-02-28 18:00:00'),  -- Topolino
  ('aa000001-0003-4000-aa00-000000000003', 'b1b2c3d4-0003-4000-b000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', true, '2026-02-28 18:00:00'),  -- Pippo
  ('aa000001-0004-4000-aa00-000000000004', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', true, '2026-02-28 18:00:00')   -- Minni
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TASK TIMESHEETS - ore lavorate (gennaio-febbraio 2026)
-- ============================================================================

INSERT INTO public.task_timesheet (timesheet_id, task_id, company_id, user_id, timesheet_date, total_hours, details) VALUES

-- ── Paperino Paperinik ───────────────────────────────────────────────────────
-- Frontend Dashboard Patrimonio (Caveau)
('aa000001-0001-4000-ab00-000000000001', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-09', 8.00, 'Componente React grafico patrimonio a torta'),
('aa000001-0002-4000-ab00-000000000002', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-10', 7.50, 'Drill-down per tipo valuta e periodo'),
('aa000001-0003-4000-ab00-000000000003', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-11', 8.00, 'Export PDF report patrimonio mensile'),
('aa000001-0004-4000-ab00-000000000004', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-12', 6.00, 'Fix responsive design tablet Paperone'),
('aa000001-0005-4000-ab00-000000000005', 'e1e2e3e4-0003-4000-a000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-13', 8.00, 'Integrazione API real-time websocket'),
-- Setup Sensori IoT (Numero Uno)
('aa000001-0006-4000-ab00-000000000006', 'e1e2e3e4-0006-4000-a000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-16', 4.00, 'Configurazione broker MQTT e topic sensori'),
('aa000001-0007-4000-ab00-000000000007', 'e1e2e3e4-0006-4000-a000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-17', 8.00, 'Calibrazione sensori temperatura e umidità'),
('aa000001-0008-4000-ab00-000000000008', 'e1e2e3e4-0006-4000-a000-000000000006', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-18', 7.00, 'Test integrazione sensore vibrazione teca'),
-- Engine Vulnerability Scanner (Allarme Bassotti)
('aa000001-0009-4000-ab00-000000000009', 'e1e2e3e4-0014-4000-a000-000000000014', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-19', 8.00, 'Sviluppo modulo port scanning TCP/UDP'),
('aa000001-0010-4000-ab00-000000000010', 'e1e2e3e4-0014-4000-a000-000000000014', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-20', 6.50, 'Integrazione database CVE e scoring CVSS'),
-- Migrazione DB Cloud (Deposito Cloud)
('aa000001-0021-4000-ab00-000000000021', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-19', 8.00, 'Setup replica logica PostgreSQL'),
('aa000001-0022-4000-ab00-000000000022', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-20', 7.00, 'Migrazione schema e dati tabelle principali'),
('aa000001-0023-4000-ab00-000000000023', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-21', 8.00, 'Test consistenza dati post-migrazione'),
('aa000001-0024-4000-ab00-000000000024', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-22', 6.50, 'Migrazione object storage S3-compatible'),
('aa000001-0025-4000-ab00-000000000025', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-02', 8.00, 'Rollback plan e script di verifica'),
('aa000001-0026-4000-ab00-000000000026', 'e1e2e3e4-0019-4000-a000-000000000019', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-03', 7.50, 'Performance test query critiche su cloud'),
-- Backend Comandi Robottino (Robottino Helper)
('aa000001-0027-4000-ab00-000000000027', 'e1e2e3e4-0023-4000-a000-000000000023', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-04', 8.00, 'API endpoint invio comandi BLE'),
('aa000001-0028-4000-ab00-000000000028', 'e1e2e3e4-0023-4000-a000-000000000023', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-05', 7.00, 'Modulo raccolta telemetria e storico'),
('aa000001-0029-4000-ab00-000000000029', 'e1e2e3e4-0023-4000-a000-000000000023', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-02-06', 8.00, 'WebSocket per stato batteria real-time'),
-- Backend Gestione Fascicoli (Fascicolo Digitale)
('aa000001-0030-4000-ab00-000000000030', 'e1e2e3e4-0033-4000-a000-000000000033', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-26', 8.00, 'CRUD fascicoli e gestione stati workflow'),
('aa000001-0031-4000-ab00-000000000031', 'e1e2e3e4-0033-4000-a000-000000000033', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-27', 6.00, 'Full-text search con tsvector PostgreSQL'),
('aa000001-0032-4000-ab00-000000000032', 'e1e2e3e4-0033-4000-a000-000000000033', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', '2026-01-28', 7.50, 'Audit trail e log accessi fascicoli'),

-- ── Topolino De' Topi (PM) ──────────────────────────────────────────────────
-- Modulo Fatturazione (Caveau)
('aa000001-0011-4000-ab00-000000000011', 'e1e2e3e4-0004-4000-a000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-09', 3.00, 'Review specifiche integrazione SDI'),
('aa000001-0012-4000-ab00-000000000012', 'e1e2e3e4-0004-4000-a000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-10', 4.00, 'Validazione XML FatturaPA con XSD'),
('aa000001-0013-4000-ab00-000000000013', 'e1e2e3e4-0004-4000-a000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-11', 2.50, 'Test invio fattura di prova a SDI'),
-- API Ricerca Brevetti (Inventarium)
('aa000001-0014-4000-ab00-000000000014', 'e1e2e3e4-0010-4000-a000-000000000010', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-12', 5.00, 'Setup Elasticsearch e mapping indici'),
('aa000001-0015-4000-ab00-000000000015', 'e1e2e3e4-0010-4000-a000-000000000010', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-13', 6.00, 'Endpoint filtri avanzati per categoria'),
-- Report OWASP (Allarme Bassotti)
('aa000001-0016-4000-ab00-000000000016', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-16', 7.00, 'Template report OWASP Top 10 in PDF'),
('aa000001-0017-4000-ab00-000000000017', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-17', 8.00, 'Generazione automatica remediation plan'),
('aa000001-0018-4000-ab00-000000000018', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-18', 4.00, 'Dashboard tracking fix vulnerabilità'),
('aa000001-0019-4000-ab00-000000000019', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-19', 6.00, 'Review report con Banda Bassotti'),
('aa000001-0020-4000-ab00-000000000020', 'e1e2e3e4-0015-4000-a000-000000000015', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001', '2026-02-20', 5.00, 'Fix export CSV e integrazione Jira'),

-- ── Pippo De' Pippis ────────────────────────────────────────────────────────
-- Frontend Investigatori (Fascicolo Digitale)
('aa000001-0033-4000-ab00-000000000033', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-02', 7.00, 'Layout pagina ricerca fascicoli'),
('aa000001-0034-4000-ab00-000000000034', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-03', 8.00, 'Componente timeline eventi fascicolo'),
('aa000001-0035-4000-ab00-000000000035', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-04', 6.00, 'Upload documenti con drag&drop'),
('aa000001-0036-4000-ab00-000000000036', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-11', 8.00, 'Viewer PDF inline con annotazioni'),
('aa000001-0037-4000-ab00-000000000037', 'e1e2e3e4-0034-4000-a000-000000000034', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-17', 7.00, 'Filtri avanzati per sezione e stato'),
-- Backend GPS Pattuglie (Mappa Pattuglie)
('aa000001-0038-4000-ab00-000000000038', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-05', 8.00, 'API raccolta posizioni GPS WebSocket'),
('aa000001-0039-4000-ab00-000000000039', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-06', 7.50, 'Engine geofencing e regole zona'),
('aa000001-0040-4000-ab00-000000000040', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-12', 7.00, 'Algoritmo ottimizzazione percorsi'),
('aa000001-0041-4000-ab00-000000000041', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-16', 6.50, 'Storico posizioni e replay percorsi'),
('aa000001-0042-4000-ab00-000000000042', 'e1e2e3e4-0037-4000-a000-000000000037', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-20', 8.00, 'Test carico con 50 pattuglie simulate'),
-- Backend Tracking Container (Porto Digitale)
('aa000001-0043-4000-ab00-000000000043', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-09', 8.00, 'Schema DB container e movimentazioni'),
('aa000001-0044-4000-ab00-000000000044', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-10', 6.00, 'API lettura codici RFID/QR scanner'),
('aa000001-0045-4000-ab00-000000000045', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-13', 8.00, 'Endpoint storico movimentazioni container'),
('aa000001-0046-4000-ab00-000000000046', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-18', 5.00, 'Notifiche stato spedizione via webhook'),
('aa000001-0047-4000-ab00-000000000047', 'e1e2e3e4-0042-4000-a000-000000000042', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0003-4000-b000-000000000003', '2026-02-19', 7.00, 'Test integrazione scanner magazzino'),

-- ── Minni Topetti ───────────────────────────────────────────────────────────
-- Migrazione Servizi (Deposito Cloud)
('aa000001-0048-4000-ab00-000000000048', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-02', 8.00, 'Dockerfile servizio autenticazione'),
('aa000001-0049-4000-ab00-000000000049', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-03', 7.00, 'Helm chart e deploy su K8s dev'),
('aa000001-0050-4000-ab00-000000000050', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-09', 8.00, 'Containerizzazione servizio notifiche'),
('aa000001-0051-4000-ab00-000000000051', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-10', 7.50, 'Config Vault per secrets management'),
('aa000001-0052-4000-ab00-000000000052', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-17', 8.00, 'Health checks e readiness probes'),
('aa000001-0053-4000-ab00-000000000053', 'e1e2e3e4-0020-4000-a000-000000000020', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-20', 7.00, 'Test deploy staging con rollback'),
-- Modulo Comandi Vocali (Robottino Helper)
('aa000001-0054-4000-ab00-000000000054', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-04', 8.00, 'Integrazione speech-to-text Whisper API'),
('aa000001-0055-4000-ab00-000000000055', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-05', 6.50, 'Dataset comandi Archimede e fine-tuning'),
('aa000001-0056-4000-ab00-000000000056', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-11', 8.00, 'Mapping comandi vocali → azioni robot'),
('aa000001-0057-4000-ab00-000000000057', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-16', 7.00, 'Test riconoscimento in ambiente rumoroso'),
('aa000001-0058-4000-ab00-000000000058', 'e1e2e3e4-0024-4000-a000-000000000024', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-19', 5.50, 'Feedback vocale text-to-speech'),
-- Portale Sdoganamento (Porto Digitale)
('aa000001-0059-4000-ab00-000000000059', 'e1e2e3e4-0043-4000-a000-000000000043', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-06', 8.00, 'Form upload documenti doganali'),
('aa000001-0060-4000-ab00-000000000060', 'e1e2e3e4-0043-4000-a000-000000000043', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-12', 6.00, 'Validazione automatica documenti'),
('aa000001-0061-4000-ab00-000000000061', 'e1e2e3e4-0043-4000-a000-000000000043', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-13', 8.00, 'Integrazione API Agenzia Dogane'),
('aa000001-0062-4000-ab00-000000000062', 'e1e2e3e4-0043-4000-a000-000000000043', 'a1b2c3d4-0001-4000-a000-000000000001', 'b1b2c3d4-0004-4000-b000-000000000004', '2026-02-18', 7.00, 'Workflow approvazione pratica doganale')

ON CONFLICT DO NOTHING;

-- Collega ogni timesheet allo snapshot submitted del rispettivo utente
UPDATE public.task_timesheet SET snapshot_id = 'aa000001-0001-4000-aa00-000000000001' WHERE user_id = 'b1b2c3d4-0002-4000-b000-000000000002' AND company_id = 'a1b2c3d4-0001-4000-a000-000000000001' AND snapshot_id IS NULL;
UPDATE public.task_timesheet SET snapshot_id = 'aa000001-0002-4000-aa00-000000000002' WHERE user_id = 'b1b2c3d4-0001-4000-b000-000000000001' AND company_id = 'a1b2c3d4-0001-4000-a000-000000000001' AND snapshot_id IS NULL;
UPDATE public.task_timesheet SET snapshot_id = 'aa000001-0003-4000-aa00-000000000003' WHERE user_id = 'b1b2c3d4-0003-4000-b000-000000000003' AND company_id = 'a1b2c3d4-0001-4000-a000-000000000001' AND snapshot_id IS NULL;
UPDATE public.task_timesheet SET snapshot_id = 'aa000001-0004-4000-aa00-000000000004' WHERE user_id = 'b1b2c3d4-0004-4000-b000-000000000004' AND company_id = 'a1b2c3d4-0001-4000-a000-000000000001' AND snapshot_id IS NULL;

-- ============================================================================
-- ESTIMATES
-- ============================================================================

-- Stima 1: App Qui Quo Qua (Deposito, DRAFT)
INSERT INTO public.estimate (
  estimate_id, client_id, title, description, status,
  pct_analysis, pct_development, pct_internal_test, pct_uat,
  pct_release, pct_pm, pct_startup, pct_documentation,
  contingency_percentage, created_by, project_managers
) VALUES (
  'ee000001-0001-4000-ae00-000000000001',
  'c1c2c3d4-0001-4000-8000-000000000001',
  'App Qui Quo Qua - Giovani Marmotte',
  'Stima per app mobile delle Giovani Marmotte. Manuale digitale, badge, missioni e geolocalizzazione avventure.',
  'DRAFT',
  15.00, 40.00, 5.00, 10.00,
  2.00, 10.00, 12.00, 6.00,
  15.00,
  'b1b2c3d4-0001-4000-b000-000000000001',
  ARRAY['b1b2c3d4-0001-4000-b000-000000000001']::uuid[]
)
ON CONFLICT DO NOTHING;

-- Stima 2: Portale Bassotti Security (Banda Bassotti, DRAFT)
INSERT INTO public.estimate (
  estimate_id, client_id, title, description, status,
  pct_analysis, pct_development, pct_internal_test, pct_uat,
  pct_release, pct_pm, pct_startup, pct_documentation,
  contingency_percentage, created_by, project_managers
) VALUES (
  'ee000001-0002-4000-ae00-000000000002',
  'c1c2c3d4-0003-4000-8000-000000000003',
  'Portale Bassotti Security Academy',
  'Stima per piattaforma e-learning di cybersecurity. Corsi, certificazioni e simulazioni di attacco per clienti enterprise.',
  'DRAFT',
  12.00, 42.00, 5.00, 12.00,
  2.00, 8.00, 13.00, 6.00,
  18.00,
  'b1b2c3d4-0001-4000-b000-000000000001',
  ARRAY['b1b2c3d4-0001-4000-b000-000000000001']::uuid[]
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ESTIMATE TASKS - App Qui Quo Qua
-- ============================================================================

INSERT INTO public.estimate_task (
  estimate_task_id, estimate_id, activity_name, activity_detail, hours_development_input,
  hours_analysis, hours_development, hours_internal_test, hours_uat,
  hours_release, hours_pm, hours_startup, hours_documentation, hours_contingency
) VALUES
(
  'ef000001-0001-4000-af00-000000000001',
  'ee000001-0001-4000-ae00-000000000001',
  'UX/UI Design App',
  'Design dell''interfaccia per l''app Giovani Marmotte. Wireframe, mockup e prototipo interattivo.',
  40.00,
  6.00, 40.00, 2.00, 4.00, 0.80, 4.00, 4.80, 2.40, 9.00
),
(
  'ef000001-0002-4000-af00-000000000002',
  'ee000001-0001-4000-ae00-000000000001',
  'Backend API e Database',
  'API REST per gestione badge, missioni e classifica. Database PostgreSQL con geolocalizzazione.',
  80.00,
  12.00, 80.00, 4.00, 8.00, 1.60, 8.00, 9.60, 4.80, 18.06
),
(
  'ef000001-0003-4000-af00-000000000003',
  'ee000001-0001-4000-ae00-000000000001',
  'Sviluppo Frontend Mobile',
  'App React Native con mappa interattiva, scanner QR per badge e notifiche push.',
  200.00,
  30.00, 200.00, 10.00, 20.00, 4.00, 20.00, 24.00, 12.00, 45.00
),
(
  'ef000001-0004-4000-af00-000000000004',
  'ee000001-0001-4000-ae00-000000000001',
  'Integrazione Geolocalizzazione',
  'Modulo GPS per tracciamento avventure, zone di interesse e percorsi escursionistici.',
  60.00,
  9.00, 60.00, 3.00, 6.00, 1.20, 6.00, 7.20, 3.60, 13.50
),
(
  'ef000001-0005-4000-af00-000000000005',
  'ee000001-0001-4000-ae00-000000000001',
  'Testing e Rilascio Store',
  'Test end-to-end, beta testing con le Giovani Marmotte e pubblicazione su App Store e Play Store.',
  30.00,
  4.50, 30.00, 1.50, 3.00, 0.60, 3.00, 3.60, 1.80, 6.75
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ESTIMATE TASKS - Portale Bassotti Security Academy
-- ============================================================================

INSERT INTO public.estimate_task (
  estimate_task_id, estimate_id, activity_name, activity_detail, hours_development_input,
  hours_analysis, hours_development, hours_internal_test, hours_uat,
  hours_release, hours_pm, hours_startup, hours_documentation, hours_contingency
) VALUES
(
  'ef000001-0006-4000-af00-000000000006',
  'ee000001-0002-4000-ae00-000000000002',
  'Piattaforma E-Learning',
  'Sviluppo LMS custom con video corsi, quiz interattivi e certificazioni di cybersecurity.',
  50.00,
  6.00, 50.00, 2.50, 6.00, 1.00, 4.00, 6.50, 3.00, 9.00
),
(
  'ef000001-0007-4000-af00-000000000007',
  'ee000001-0002-4000-ae00-000000000002',
  'Simulatore Attacchi',
  'Ambiente sandbox per simulazioni di phishing, social engineering e penetration testing guidato.',
  35.00,
  4.20, 35.00, 1.75, 4.20, 0.70, 2.80, 4.55, 2.10, 6.30
),
(
  'ef000001-0008-4000-af00-000000000008',
  'ee000001-0002-4000-ae00-000000000002',
  'Dashboard e Reportistica',
  'Dashboard per tracking progressi studenti, metriche di completamento e report per HR aziendali.',
  250.00,
  30.00, 250.00, 12.50, 30.00, 5.00, 20.00, 32.50, 15.00, 45.00
),
(
  'ef000001-0009-4000-af00-000000000009',
  'ee000001-0002-4000-ae00-000000000002',
  'Integrazione SSO e Deploy',
  'Single Sign-On enterprise, deploy su Kubernetes e documentazione API per integrazioni terze parti.',
  40.00,
  4.80, 40.00, 2.00, 4.80, 0.80, 3.20, 5.20, 2.40, 7.20
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- HOLIDAY CALENDAR (festività italiane 2026 per Paperopoly)
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
-- Paperino Paperinik - ferie estive (1 settimana agosto)
('dd000001-0001-4000-9d00-000000000001', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-03', 8.00, 'Ferie estive'),
('dd000001-0002-4000-9d00-000000000002', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-04', 8.00, 'Ferie estive'),
('dd000001-0003-4000-9d00-000000000003', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-05', 8.00, 'Ferie estive'),
('dd000001-0004-4000-9d00-000000000004', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-06', 8.00, 'Ferie estive'),
('dd000001-0005-4000-9d00-000000000005', 'b1b2c3d4-0002-4000-b000-000000000002', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-07', 8.00, 'Ferie estive'),
-- Topolino De' Topi - permesso + ferie
('dd000001-0006-4000-9d00-000000000006', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'OTHER', '2026-03-06', 4.00, 'Visita medica'),
('dd000001-0007-4000-9d00-000000000007', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-10', 8.00, 'Ferie estive'),
('dd000001-0008-4000-9d00-000000000008', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-11', 8.00, 'Ferie estive'),
('dd000001-0009-4000-9d00-000000000009', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-12', 8.00, 'Ferie estive'),
('dd000001-0010-4000-9d00-000000000010', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-13', 8.00, 'Ferie estive'),
('dd000001-0011-4000-9d00-000000000011', 'b1b2c3d4-0001-4000-b000-000000000001', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-14', 8.00, 'Ferie estive'),
-- Pippo De' Pippis - ferie estive (1 settimana agosto)
('dd000001-0012-4000-9d00-000000000012', 'b1b2c3d4-0003-4000-b000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-10', 8.00, 'Ferie estive'),
('dd000001-0013-4000-9d00-000000000013', 'b1b2c3d4-0003-4000-b000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-11', 8.00, 'Ferie estive'),
('dd000001-0014-4000-9d00-000000000014', 'b1b2c3d4-0003-4000-b000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-12', 8.00, 'Ferie estive'),
('dd000001-0015-4000-9d00-000000000015', 'b1b2c3d4-0003-4000-b000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-13', 8.00, 'Ferie estive'),
('dd000001-0016-4000-9d00-000000000016', 'b1b2c3d4-0003-4000-b000-000000000003', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-14', 8.00, 'Ferie estive'),
-- Minni Topetti - permesso + malattia + ferie
('dd000001-0017-4000-9d00-000000000017', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'OTHER', '2026-03-13', 4.00, 'Appuntamento'),
('dd000001-0018-4000-9d00-000000000018', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'OTHER', '2026-01-15', 8.00, 'Influenza'),
('dd000001-0019-4000-9d00-000000000019', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'OTHER', '2026-01-16', 8.00, 'Influenza'),
('dd000001-0020-4000-9d00-000000000020', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-17', 8.00, 'Ferie estive'),
('dd000001-0021-4000-9d00-000000000021', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-18', 8.00, 'Ferie estive'),
('dd000001-0022-4000-9d00-000000000022', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-19', 8.00, 'Ferie estive'),
('dd000001-0023-4000-9d00-000000000023', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-20', 8.00, 'Ferie estive'),
('dd000001-0024-4000-9d00-000000000024', 'b1b2c3d4-0004-4000-b000-000000000004', 'a1b2c3d4-0001-4000-a000-000000000001', 'VACATION', '2026-08-21', 8.00, 'Ferie estive')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PM RECONCILIATION TEMPLATE
-- ============================================================================
-- Template per Topolino De' Topi: mappa le colonne del file JIRA export
-- verso i dati di riconciliazione timesheet di Pleasy.
-- La staging table simula un export CSV caricato dal PM.

INSERT INTO public.pm_reconciliation_template (
  template_id, pm_id, company_id, template_name, staging_table_name,
  column_names, sql_query
) VALUES (
  'bb000001-0001-4000-bb00-000000000001',
  'b1b2c3d4-0001-4000-b000-000000000001',
  'a1b2c3d4-0001-4000-a000-000000000001',
  'JIRA Timesheet Export',
  'pm_staging_b1b2c3d4_0001_4000_b000_000000000001',
  '{"columns":["jira_key","author_email","work_date","hours_spent","work_description"],"originalColumns":["jira_key","author_email","work_date","hours_spent","work_description"],"columnMapping":{"jira_key":"jira_key","author_email":"author_email","work_date":"work_date","hours_spent":"hours_spent","work_description":"work_description"}}'::jsonb,
  'SELECT s.jira_key AS external_key, u.user_id, SUM(s.hours_spent) AS total_hours FROM pm_staging_b1b2c3d4_0001_4000_b000_000000000001 s JOIN pm_users_view_b1b2c3d4_0001_4000_b000_000000000001 u ON s.author_email = u.email WHERE s.hours_spent > 0 GROUP BY s.jira_key, u.user_id'
)
ON CONFLICT ON CONSTRAINT pm_reconciliation_template_pm_unique DO UPDATE SET
  template_name = EXCLUDED.template_name,
  staging_table_name = EXCLUDED.staging_table_name,
  column_names = EXCLUDED.column_names,
  sql_query = EXCLUDED.sql_query;

-- ============================================================================
-- PM USERS VIEW (vista utenti per la riconciliazione)
-- ============================================================================
-- Normalmente creata dall'app al primo upload. La creiamo nel seed per coerenza.

CREATE OR REPLACE VIEW public.pm_users_view_b1b2c3d4_0001_4000_b000_000000000001 AS
SELECT user_id, email, full_name
FROM public.users
WHERE company_id = 'a1b2c3d4-0001-4000-a000-000000000001';

-- ============================================================================
-- STAGING TABLE (creazione + dati simulati export JIRA)
-- ============================================================================
-- Questa tabella simula il file CSV che il PM carica per la riconciliazione.
-- I dati devono corrispondere (o divergere in parte) dai timesheet Pleasy
-- per mostrare match, mismatch e righe non riconciliate.

CREATE TABLE IF NOT EXISTS public.pm_staging_b1b2c3d4_0001_4000_b000_000000000001 (
  id serial PRIMARY KEY,
  jira_key character varying(100) NOT NULL,
  author_email character varying(255) NOT NULL,
  work_date date NOT NULL,
  hours_spent numeric(5,2) NOT NULL,
  work_description text
);


INSERT INTO public.pm_staging_b1b2c3d4_0001_4000_b000_000000000001 (jira_key, author_email, work_date, hours_spent, work_description) VALUES
-- ── Match esatti con timesheet Pleasy (stesse ore) ──────────────────────────
('JIRA-CAV-103', 'paperino.paperinik@paperopoly.it', '2026-02-09', 8.00, 'Componente React grafico patrimonio'),
('JIRA-CAV-103', 'paperino.paperinik@paperopoly.it', '2026-02-10', 7.50, 'Drill-down valuta e periodo'),
('JIRA-CAV-103', 'paperino.paperinik@paperopoly.it', '2026-02-11', 8.00, 'Export PDF report patrimonio'),
('JIRA-CAV-103', 'paperino.paperinik@paperopoly.it', '2026-02-13', 8.00, 'Integrazione websocket'),
('JIRA-CAV-104', 'topolino.detopi@paperopoly.it',    '2026-02-09', 3.00, 'Review specifiche SDI'),
('JIRA-CAV-104', 'topolino.detopi@paperopoly.it',    '2026-02-10', 4.00, 'Validazione XML FatturaPA'),
('JIRA-CLD-503', 'paperino.paperinik@paperopoly.it', '2026-01-19', 8.00, 'Setup replica logica PostgreSQL'),
('JIRA-CLD-503', 'paperino.paperinik@paperopoly.it', '2026-01-20', 7.00, 'Migrazione schema e dati'),
('JIRA-CLD-503', 'paperino.paperinik@paperopoly.it', '2026-01-21', 8.00, 'Test consistenza dati'),
('JIRA-CLD-503', 'paperino.paperinik@paperopoly.it', '2026-01-22', 6.50, 'Migrazione object storage S3-compatible'),
('JIRA-CLD-503', 'paperino.paperinik@paperopoly.it', '2026-02-02', 8.00, 'Rollback plan e script di verifica'),
('JIRA-CLD-503', 'paperino.paperinik@paperopoly.it', '2026-02-03', 7.50, 'Performance test query critiche'),
('JIRA-FSC-803', 'paperino.paperinik@paperopoly.it', '2026-01-26', 8.00, 'CRUD fascicoli e workflow'),
('JIRA-FSC-803', 'paperino.paperinik@paperopoly.it', '2026-01-27', 6.00, 'Full-text search tsvector'),
('JIRA-FSC-803', 'paperino.paperinik@paperopoly.it', '2026-01-28', 7.50, 'Audit trail e log accessi fascicoli'),
('JIRA-ROB-602', 'paperino.paperinik@paperopoly.it', '2026-02-04', 8.00, 'API endpoint comandi BLE'),
('JIRA-ROB-602', 'paperino.paperinik@paperopoly.it', '2026-02-05', 7.00, 'Raccolta telemetria'),
('JIRA-ROB-602', 'paperino.paperinik@paperopoly.it', '2026-02-06', 8.00, 'WebSocket stato batteria real-time'),

-- ── Mismatch ore (JIRA riporta ore diverse da Pleasy) ───────────────────────
('JIRA-CAV-103', 'paperino.paperinik@paperopoly.it', '2026-02-12', 8.00, 'Fix responsive tablet'),         -- Pleasy: 6.00, JIRA: 8.00
('JIRA-CAV-104', 'topolino.detopi@paperopoly.it',    '2026-02-11', 4.00, 'Test invio fattura SDI'),         -- Pleasy: 2.50, JIRA: 4.00
('JIRA-NUNO-201','paperino.paperinik@paperopoly.it', '2026-02-16', 6.00, 'Configurazione MQTT'),            -- Pleasy: 4.00, JIRA: 6.00
('JIRA-NUNO-201','paperino.paperinik@paperopoly.it', '2026-02-17', 6.50, 'Calibrazione sensori'),           -- Pleasy: 8.00, JIRA: 6.50
('JIRA-CLD-504', 'minni.topetti@paperopoly.it',      '2026-02-02', 6.00, 'Dockerfile auth service'),        -- Pleasy: 8.00, JIRA: 6.00
('JIRA-FSC-804', 'pippo.depippis@paperopoly.it',     '2026-02-02', 8.00, 'Layout ricerca fascicoli'),       -- Pleasy: 7.00, JIRA: 8.00

-- ── Righe solo in JIRA (non presenti in Pleasy) ─────────────────────────────
('JIRA-CAV-103', 'paperino.paperinik@paperopoly.it', '2026-02-14', 4.00, 'Bugfix filtro date dashboard'),
('JIRA-ALR-402', 'paperino.paperinik@paperopoly.it', '2026-02-21', 7.00, 'Modulo fingerprinting OS'),
('JIRA-PRT-1002','pippo.depippis@paperopoly.it',     '2026-02-21', 8.00, 'API mappa banchine porto'),
('JIRA-ROB-603', 'minni.topetti@paperopoly.it',      '2026-02-21', 6.00, 'Test comandi vocali laboratorio');

-- ============================================================================
-- TIMESHEET RECONCILIATION (dati riconciliati dal PM)
-- ============================================================================
-- Queste righe rappresentano i dati esterni già importati e riconciliati.
-- external_key corrisponde alla chiave JIRA del task.

INSERT INTO public.timesheet_reconciliation (
  reconciliation_id, timestamp_reconciliation, company_id, external_key,
  total_hours, user_id, pm_id
) VALUES
-- ── MATCH (ore uguali a Pleasy → bollino verde) ────────────────────────────
-- JIRA-CLD-503 / Paperino: staging 8+7+8+6.5+8+7.5 = 45h = Pleasy 45h ✓
('bb000002-0001-4000-bc00-000000000001', '2026-02-28 18:00:00', 'a1b2c3d4-0001-4000-a000-000000000001', 'JIRA-CLD-503', 45.00, 'b1b2c3d4-0002-4000-b000-000000000002', 'b1b2c3d4-0001-4000-b000-000000000001'),
-- JIRA-FSC-803 / Paperino: staging 8+6+7.5 = 21.5h = Pleasy 21.5h ✓
('bb000002-0002-4000-bc00-000000000002', '2026-02-28 18:00:00', 'a1b2c3d4-0001-4000-a000-000000000001', 'JIRA-FSC-803', 21.50, 'b1b2c3d4-0002-4000-b000-000000000002', 'b1b2c3d4-0001-4000-b000-000000000001'),
-- JIRA-ROB-602 / Paperino: staging 8+7+8 = 23h = Pleasy 23h ✓
('bb000002-0003-4000-bc00-000000000003', '2026-02-28 18:00:00', 'a1b2c3d4-0001-4000-a000-000000000001', 'JIRA-ROB-602', 23.00, 'b1b2c3d4-0002-4000-b000-000000000002', 'b1b2c3d4-0001-4000-b000-000000000001'),
-- ── MISMATCH (ore diverse da Pleasy → bollino rosso) ────────────────────────
-- JIRA-CAV-103 / Paperino: staging 8+7.5+8+8+8+4 = 43.5h ≠ Pleasy 37.5h (JIRA +6h)
('bb000002-0004-4000-bc00-000000000004', '2026-02-28 18:00:00', 'a1b2c3d4-0001-4000-a000-000000000001', 'JIRA-CAV-103', 43.50, 'b1b2c3d4-0002-4000-b000-000000000002', 'b1b2c3d4-0001-4000-b000-000000000001'),
-- JIRA-CAV-104 / Topolino: staging 3+4+4 = 11h ≠ Pleasy 9.5h (JIRA +1.5h)
('bb000002-0005-4000-bc00-000000000005', '2026-02-28 18:00:00', 'a1b2c3d4-0001-4000-a000-000000000001', 'JIRA-CAV-104', 11.00, 'b1b2c3d4-0001-4000-b000-000000000001', 'b1b2c3d4-0001-4000-b000-000000000001'),
-- JIRA-CLD-504 / Minni: staging 6h ≠ Pleasy 45.5h (solo 1 giorno in JIRA)
('bb000002-0006-4000-bc00-000000000006', '2026-02-28 18:00:00', 'a1b2c3d4-0001-4000-a000-000000000001', 'JIRA-CLD-504', 6.00, 'b1b2c3d4-0004-4000-b000-000000000004', 'b1b2c3d4-0001-4000-b000-000000000001'),
-- JIRA-FSC-804 / Pippo: staging 8h ≠ Pleasy 36h
('bb000002-0007-4000-bc00-000000000007', '2026-02-28 18:00:00', 'a1b2c3d4-0001-4000-a000-000000000001', 'JIRA-FSC-804', 8.00, 'b1b2c3d4-0003-4000-b000-000000000003', 'b1b2c3d4-0001-4000-b000-000000000001'),
-- JIRA-ALR-402 / Paperino: staging 7h ≠ Pleasy 14.5h
('bb000002-0008-4000-bc00-000000000008', '2026-02-28 18:00:00', 'a1b2c3d4-0001-4000-a000-000000000001', 'JIRA-ALR-402', 7.00, 'b1b2c3d4-0002-4000-b000-000000000002', 'b1b2c3d4-0001-4000-b000-000000000001'),
-- JIRA-PRT-1002 / Pippo: staging 8h ≠ Pleasy 34h
('bb000002-0009-4000-bc00-000000000009', '2026-02-28 18:00:00', 'a1b2c3d4-0001-4000-a000-000000000001', 'JIRA-PRT-1002', 8.00, 'b1b2c3d4-0003-4000-b000-000000000003', 'b1b2c3d4-0001-4000-b000-000000000001'),
-- JIRA-ROB-603 / Minni: staging 6h ≠ Pleasy 35h
('bb000002-0010-4000-bc00-000000000010', '2026-02-28 18:00:00', 'a1b2c3d4-0001-4000-a000-000000000001', 'JIRA-ROB-603', 6.00, 'b1b2c3d4-0004-4000-b000-000000000004', 'b1b2c3d4-0001-4000-b000-000000000001'),
-- JIRA-NUNO-201 / Paperino: staging 6+6.5 = 12.5h (progetto TM, non visibile in riconciliazione)
('bb000002-0011-4000-bc00-000000000011', '2026-02-28 18:00:00', 'a1b2c3d4-0001-4000-a000-000000000001', 'JIRA-NUNO-201', 12.50, 'b1b2c3d4-0002-4000-b000-000000000002', 'b1b2c3d4-0001-4000-b000-000000000001')
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================================
-- RIEPILOGO DATI INSERITI
-- ============================================================================
--
-- AZIENDA:  Paperopoly S.r.l. (PPOLY)
--
-- UTENTI (4):
--   Topolino De' Topi    | PM   | topolino.detopi@paperopoly.it    | pwd: admin123
--   Paperino Paperinik   | USER | paperino.paperinik@paperopoly.it | pwd: admin123
--   Pippo De' Pippis     | USER | pippo.depippis@paperopoly.it     | pwd: admin123
--   Minni Topetti        | USER | minni.topetti@paperopoly.it      | pwd: admin123
--
-- CLIENTI (5):
--   Deposito De' Paperoni S.p.A.  (#EF4444 rosso)
--   Archimede Lab S.r.l.          (#3B82F6 blu)
--   Banda Bassotti Inc.           (#10B981 verde)
--   Questura di Topolinia         (#F59E0B giallo)
--   Gambadilegno Trasporti S.r.l. (#8B5CF6 viola)
--
-- PROGETTI (10):
--   PPOLY-PERON-CAVEAU → Caveau Digitale - Sistema Contabile (PROJECT, 5 task)
--   PPOLY-PERON-NUNO   → Monitoraggio Numero Uno (TM, 3 task)
--   PPOLY-PERON-CLOUD  → Deposito Cloud - Migrazione (PROJECT, 5 task)
--   PPOLY-ARCHI-INVENT → Inventarium - Catalogo Brevetti (PROJECT, 4 task)
--   PPOLY-ARCHI-ROBOT  → Robottino Helper - App Controllo (PROJECT, 5 task)
--   PPOLY-BANDA-ALARM  → Allarme Bassotti - Pen Testing (PROJECT, 4 task)
--   PPOLY-BANDA-SORV   → Sorveglianza Bassotti - CCTV (TM, 4 task)
--   PPOLY-BASET-FASC   → Fascicolo Digitale - Indagini (PROJECT, 6 task)
--   PPOLY-BASET-PATT   → Mappa Pattuglie - GPS (TM, 4 task)
--   PPOLY-GAMBA-PORTO  → Porto Digitale - Logistica (PROJECT, 5 task)
--
-- TASK: 45 totali (11 DONE, 17 IN PROGRESS, 17 NEW) — tutti con external_key (JIRA-*)
-- TIMESHEET: 62 entries (gennaio-febbraio 2026, tutti e 4 gli utenti)
-- ETC: 17 stime per i task in progress
-- STIME: 2 (App Qui Quo Qua 5 attività, Portale Bassotti 4 attività)
-- FESTIVITÀ: 11 (calendario italiano 2026)
-- TIME OFF: 24 giorni pianificati (VACATION, OTHER)
--
-- RICONCILIAZIONE:
--   Template PM: "JIRA Timesheet Export" (pm_staging_b1b2c3d4_0001_4000_b000_000000000001)
--   Staging:     28 righe (18 match, 6 mismatch ore, 4 solo JIRA)
--   Riconciliati: 11 entries in timesheet_reconciliation (aggregati per external_key + user_id)
--     3 match (verde):  CLD-503=45h, FSC-803=21.5h, ROB-602=23h
--     8 mismatch (rosso): CAV-103, CAV-104, CLD-504, FSC-804, ALR-402, PRT-1002, ROB-603, NUNO-201
-- ============================================================================
