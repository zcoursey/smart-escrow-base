import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Neon needs SSL
});

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  const r = await pool.query("SELECT NOW() as now");
  res.json({ ok: true, now: r.rows[0].now });
});

// create a row
app.post("/pings", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ ok: false, error: "message required" });

    const r = await pool.query(
      "INSERT INTO pings (message) VALUES ($1) RETURNING id, message, created_at",
      [message]
    );

    res.json({ ok: true, ping: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// read recent rows
app.get("/pings", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, message, created_at FROM pings ORDER BY created_at DESC LIMIT 20"
    );
    res.json({ ok: true, pings: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log("API running on", port));
