import express from "express";
import pool from "../db.js";

const router = express.Router();

router.get("/online-users", async (req, res) => {
  try {
    if (!req.session?.user?.id) {
      return res.status(401).json({ ok: false, message: "Not logged in" });
    }

    // Check role
    const userCheck = await pool.query(
      `
      SELECT u.id, r.name AS role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
      `,
      [req.session.user.id]
    );

    const user = userCheck.rows[0];

    if (!user || user.role_name !== "owner") {
      return res.status(403).json({ ok: false, message: "Access denied" });
    }

    // Get online users
    const result = await pool.query(
      `
      SELECT u.id, u.username, u.last_seen, r.name AS role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.last_seen >= NOW() - INTERVAL '5 minutes'
      ORDER BY u.last_seen DESC
      `
    );

    res.json({ ok: true, users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;
