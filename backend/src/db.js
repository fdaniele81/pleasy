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

export async function query(text, params) {
  return pool.query(text, params);
}

export default { pool, query };
