-- Crea utente readonly per l'esecuzione di query custom (reconciliation).
-- Eseguire manualmente con un utente superuser.
-- Cambiare la password prima di eseguire in produzione!

-- 1. Crea il ruolo (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'pleasy_readonly') THEN
        CREATE ROLE pleasy_readonly WITH LOGIN PASSWORD 'CAMBIAMI_IN_PRODUZIONE';
    END IF;
END $$;

-- 2. Permessi base
GRANT CONNECT ON DATABASE pleasy TO pleasy_readonly;
GRANT USAGE ON SCHEMA public TO pleasy_readonly;

-- 3. Accesso in sola lettura alle tabelle pm_staging_* e pm_users_view_*
-- (le tabelle vengono create dinamicamente, quindi usiamo un default privilege + grant esplicito)

-- Grant su tutte le tabelle esistenti che matchano il pattern
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND (tablename LIKE 'pm_staging_%' OR tablename LIKE 'pm_users_view_%')
    LOOP
        EXECUTE 'GRANT SELECT ON ' || quote_ident(r.tablename) || ' TO pleasy_readonly';
    END LOOP;
END $$;

-- Grant automatico su tabelle future create dall'utente postgres
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
    GRANT SELECT ON TABLES TO pleasy_readonly;

-- 4. Limiti di sicurezza
ALTER ROLE pleasy_readonly SET statement_timeout = '10s';
ALTER ROLE pleasy_readonly SET lock_timeout = '3s';
