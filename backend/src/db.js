import pg from "pg";
import "dotenv/config";
import logger from "./utils/logger.js";

const { Pool } = pg;

const connectionConfig = {
      host: process.env.PGHOST || "localhost",
      port: process.env.PGPORT || 5432,
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: false,
      max: 20,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    };

export const pool = new Pool(connectionConfig);

pool.on("error", (err) => {
  logger.error("Errore inatteso sul client PostgreSQL", { error: err.message, stack: err.stack });
  process.exit(-1);
});

// Pool dedicato con permessi limitati per l'esecuzione di query custom (reconciliation).
// Richiede un utente PostgreSQL "pleasy_readonly" con GRANT SELECT solo sulle tabelle pm_staging_* e pm_users_view_*.
// Se le variabili non sono configurate, usa il pool principale (retrocompatibilità in dev).
const readonlyConfig = process.env.PG_READONLY_USER ? {
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PG_READONLY_USER,
  password: process.env.PG_READONLY_PASSWORD,
  ssl: false,
  max: 5,
  min: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
  statement_timeout: 10000,
} : null;

export const readonlyPool = readonlyConfig ? new Pool(readonlyConfig) : pool;

if (readonlyConfig) {
  readonlyPool.on("error", (err) => {
    logger.error("Errore sul pool readonly PostgreSQL", { error: err.message });
  });
}

export async function query(text, params) {
  return pool.query(text, params);
}

export default { pool, readonlyPool, query };
