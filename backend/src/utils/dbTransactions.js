import db from "../db.js";

export async function beginTransaction() {
  await db.query("BEGIN");
}

export async function commitTransaction() {
  await db.query("COMMIT");
}

export async function rollbackTransaction() {
  await db.query("ROLLBACK");
}
