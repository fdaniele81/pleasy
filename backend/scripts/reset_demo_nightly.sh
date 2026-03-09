#!/usr/bin/env bash
# ============================================================================
# PLEASY — Nightly demo environment reset
# ============================================================================
# Pulisce e ri-popola l'ambiente demo "Toon Studios".
#
# Variabili d'ambiente richieste (o usa .env):
#   DATABASE_URL  — connection string PostgreSQL
#   oppure:
#   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RESET_SQL="$BACKEND_DIR/sql/reset_demo_env.sql"
SEED_SQL="$BACKEND_DIR/sql/seed_example_toon-studios.sql"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# Carica .env se presente
if [[ -f "$BACKEND_DIR/.env" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "$BACKEND_DIR/.env"
  set +a
fi

# Controlla connessione
if [[ -z "${DATABASE_URL:-}" && -z "${PGHOST:-}" ]]; then
  log "ERROR: DATABASE_URL o PGHOST non configurato"
  exit 1
fi

PSQL_CONN="${DATABASE_URL:-}"

log "Starting demo environment reset..."

# Step 1: Cleanup
log "Step 1/2: Cleaning demo data..."
if [[ -n "$PSQL_CONN" ]]; then
  psql "$PSQL_CONN" -f "$RESET_SQL"
else
  psql -f "$RESET_SQL"
fi

# Step 2: Re-seed
log "Step 2/2: Re-seeding demo data..."
if [[ -n "$PSQL_CONN" ]]; then
  psql "$PSQL_CONN" -f "$SEED_SQL"
else
  psql -f "$SEED_SQL"
fi

log "Demo environment reset complete!"
