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

const port = process.env.PORT || 3001;
app.listen(port, () => console.log("API running on", port));
