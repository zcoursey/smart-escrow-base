import pool from "../db.js";

export const updateLastSeen = async (req, res, next) => {
  try {
    if (req.session?.user?.id) {
      await pool.query(
        `UPDATE users SET last_seen = NOW() WHERE id = $1`,
        [req.session.user.id]
      );
    }
    next();
  } catch (err) {
    console.error("last_seen error:", err);
    next();
  }
};
