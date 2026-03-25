import db from "../db.js";

async function getScratchpad(userId) {
  const result = await db.query(
    `SELECT content, updated_at FROM user_scratchpad WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function saveScratchpad(userId, content) {
  const result = await db.query(
    `INSERT INTO user_scratchpad (user_id, content, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET content = $2, updated_at = NOW()
     RETURNING content, updated_at`,
    [userId, content]
  );
  return result.rows[0];
}

export { getScratchpad, saveScratchpad };

export default { getScratchpad, saveScratchpad };
