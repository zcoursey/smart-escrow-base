import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

// ---------- DB ----------
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Neon needs SSL
});

// ---------- APP ----------
const app = express();
app.use(cors());
app.use(express.json());

// ---------- HEALTH ----------
app.get("/health", async (req, res) => {
  const r = await pool.query("SELECT NOW() as now");
  res.json({ ok: true, now: r.rows[0].now });
});

// ---------- PINGS (proof DB works) ----------
app.post("/pings", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ ok: false, error: "message required" });
    }

    const r = await pool.query(
      "INSERT INTO pings (message) VALUES ($1) RETURNING id, message, created_at",
      [message]
    );

    res.json({ ok: true, ping: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

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

// =======================================================
// ================== ESCROW PLATFORM ====================
// =======================================================

// Create / register an escrow contract
app.post("/escrows", async (req, res) => {
  try {
    const {
      chain_id,
      contract_address,
      realtor_address,
      contractor_address,
      escrow_amount_wei,
    } = req.body;

    if (!contract_address || !realtor_address || !contractor_address) {
      return res.status(400).json({ ok: false, error: "missing fields" });
    }

    const r = await pool.query(
      `
      INSERT INTO escrows (
        chain_id,
        contract_address,
        realtor_address,
        contractor_address,
        escrow_amount_wei
      )
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (contract_address) DO UPDATE SET
        chain_id = EXCLUDED.chain_id,
        realtor_address = EXCLUDED.realtor_address,
        contractor_address = EXCLUDED.contractor_address,
        escrow_amount_wei = EXCLUDED.escrow_amount_wei
      RETURNING *
      `,
      [
        chain_id,
        contract_address.toLowerCase(),
        realtor_address.toLowerCase(),
        contractor_address.toLowerCase(),
        String(escrow_amount_wei),
      ]
    );

    res.json({ ok: true, escrow: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Log escrow events (Funded, Approved, Paid, Refunded, Disputed, etc.)
app.post("/escrows/:address/events", async (req, res) => {
  try {
    const contract_address = req.params.address.toLowerCase();
    const { event_name, tx_hash, actor_address, payload } = req.body;

    if (!event_name) {
      return res.status(400).json({ ok: false, error: "event_name required" });
    }

    const r = await pool.query(
      `
      INSERT INTO escrow_events (
        contract_address,
        event_name,
        tx_hash,
        actor_address,
        payload
      )
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [
        contract_address,
        event_name,
        tx_hash || null,
        actor_address ? actor_address.toLowerCase() : null,
        payload || {},
      ]
    );

    res.json({ ok: true, event: r.rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// List escrows (dashboard)
app.get("/escrows", async (req, res) => {
  const r = await pool.query(
    "SELECT * FROM escrows ORDER BY created_at DESC LIMIT 50"
  );
  res.json({ ok: true, escrows: r.rows });
});

// Escrow event history
app.get("/escrows/:address/events", async (req, res) => {
  const addr = req.params.address.toLowerCase();
  const r = await pool.query(
    `
    SELECT * FROM escrow_events
    WHERE contract_address = $1
    ORDER BY created_at DESC
    LIMIT 200
    `,
    [addr]
  );
  res.json({ ok: true, events: r.rows });
});

// ---------- START ----------
const port = process.env.PORT || 3001;
app.listen(port, () => console.log("API running on", port));
