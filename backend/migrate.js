#!/usr/bin/env node

/**
 * Simple migration runner for Pleasy.
 *
 * Reads SQL files from ./migrations/ in alphabetical order,
 * skips those already recorded in the `schema_migrations` table,
 * and executes the rest inside a transaction.
 *
 * Usage:
 *   npm run migrate            # run pending migrations
 *   npm run migrate -- --dry   # show pending migrations without executing
 */

import pg from "pg";
import "dotenv/config";
import { readdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "migrations");

const pool = new pg.Pool({
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: false,
});

async function run() {
  const dryRun = process.argv.includes("--dry");
  const client = await pool.connect();

  try {
    // Ensure the tracking table exists (idempotent)
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        filename VARCHAR(255) NOT NULL PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get already-applied migrations
    const { rows: applied } = await client.query(
      "SELECT filename FROM schema_migrations ORDER BY filename"
    );
    const appliedSet = new Set(applied.map((r) => r.filename));

    // Read migration files from disk
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    const pending = files.filter((f) => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log("✓ No pending migrations.");
      return;
    }

    console.log(`Found ${pending.length} pending migration(s):\n`);
    pending.forEach((f) => console.log(`  → ${f}`));
    console.log();

    if (dryRun) {
      console.log("Dry run — no changes applied.");
      return;
    }

    for (const filename of pending) {
      const sql = readFileSync(join(MIGRATIONS_DIR, filename), "utf-8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename]
        );
        await client.query("COMMIT");
        console.log(`  ✓ ${filename}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`  ✗ ${filename} — ${err.message}`);
        process.exit(1);
      }
    }

    console.log("\n✓ All migrations applied successfully.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
