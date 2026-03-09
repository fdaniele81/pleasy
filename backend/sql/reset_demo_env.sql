-- ============================================================================
-- PLEASY — Reset ambiente demo "Toon Studios" (Paperopoly S.r.l.)
-- ============================================================================
-- Cancella tutti i dati della company demo e ri-esegue il seed.
-- Pensato per essere schedulato ogni notte (cron / pg_cron / CI).
--
-- Uso manuale:
--   psql -h HOST -U USER -d pleasy -f sql/reset_demo_env.sql
--   psql -h HOST -U USER -d pleasy -f sql/seed_example_toon-studios.sql
-- ============================================================================
-- Tutte le FK verso company sono ON DELETE CASCADE (inclusa project → client
-- dopo la migration 005). Un singolo DELETE pulisce tutto.
-- ============================================================================

-- Drop tabelle/view dinamiche della riconciliazione (non legate via FK)
DROP TABLE IF EXISTS public.pm_staging_b1b2c3d4_0001_4000_b000_000000000001;
DROP VIEW  IF EXISTS public.pm_users_view_b1b2c3d4_0001_4000_b000_000000000001;

DELETE FROM public.company
WHERE company_id = 'a1b2c3d4-0001-4000-a000-000000000001';
