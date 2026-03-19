import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;
const app = express();

// ==============================
// BODY SIZE (for images)
// ==============================
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use(cookieParser());

// ==============================
// ERROR HANDLER
// ==============================
const isProd = process.env.NODE_ENV === "production";

function sendError(res, err, status = 500, message = "server error") {
  console.error("❌ ERROR:", err);
  return res.status(status).json({
    ok: false,
    error: message,
    debug: !isProd ? err?.message : undefined,
  });
}

// ==============================
// ✅ FIXED CORS (IMPORTANT)
// ==============================
const ALLOWED_ORIGINS = [
  process.env.WEB_ORIGIN,
  process.env.WEB_ORIGIN_ALT,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
].filter(Boolean);

// Allow ALL Vercel deployments
const VERCEL_REGEX = /^https:\/\/.*\.vercel\.app$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      if (VERCEL_REGEX.test(origin)) return callback(null, true);

      console.error("❌ BLOCKED CORS:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.options("*", cors());

// ==============================
// DATABASE
// ==============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ==============================
// AUTH HELPERS
// ==============================
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "7d" });
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ ok: false, error: "not authenticated" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "invalid token" });
  }
}

async function updateLastSeen(req, res, next) {
  try {
    if (req.user?.sub) {
      await pool.query(
        "UPDATE users SET last_seen = NOW() WHERE id = $1",
        [req.user.sub]
      );
    }
  } catch (e) {
    console.error("last_seen error:", e.message);
  }
  next();
}

function requireRole(role) {
  return async (req, res, next) => {
    const r = await pool.query(
      `SELECT r.name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id=$1`,
      [req.user.sub]
    );

    if (r.rows[0]?.name !== role) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    next();
  };
}

// ==============================
// AUTH ROUTES
// ==============================
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const r = await pool.query(
      "SELECT * FROM users WHERE username=$1",
      [username]
    );

    const user = r.rows[0];
    if (!user) return res.status(401).json({ ok: false });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ ok: false });

    const token = signToken(user);

    await pool.query(
      "UPDATE users SET last_seen = NOW() WHERE id=$1",
      [user.id]
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    res.json({ ok: true, user });
  } catch (e) {
    return sendError(res, e);
  }
});

app.get("/auth/me", authMiddleware, updateLastSeen, async (req, res) => {
  const r = await pool.query(
    `
    SELECT u.*, r.name AS role
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id=$1
    `,
    [req.user.sub]
  );

  res.json({ ok: true, user: r.rows[0] });
});

app.post("/auth/logout", authMiddleware, async (req, res) => {
  await pool.query(
    "UPDATE users SET last_seen = NULL WHERE id=$1",
    [req.user.sub]
  );

  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  res.json({ ok: true });
});

// ==============================
// OWNER ROUTE
// ==============================
app.get(
  "/api/owner/online-users",
  authMiddleware,
  updateLastSeen,
  requireRole("owner"),
  async (req, res) => {
    const r = await pool.query(
      `
      SELECT u.id, u.username, u.last_seen, r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.last_seen >= NOW() - INTERVAL '5 minutes'
      ORDER BY u.last_seen DESC
      `
    );

    res.json({ ok: true, users: r.rows });
  }
);

// ==============================
// JOBS (WITH PHOTOS)
// ==============================
app.post(
  "/api/jobs",
  authMiddleware,
  updateLastSeen,
  requireRole("client"),
  async (req, res) => {
    try {
      const { title, description, location, budget, photos } = req.body;

      const photoArray = Array.isArray(photos) ? photos.slice(0, 3) : [];

      const r = await pool.query(
        `
        INSERT INTO jobs (client_id, title, description, location, budget, photos)
        VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING *
        `,
        [req.user.sub, title, description, location, budget, photoArray]
      );

      res.json({ ok: true, job: r.rows[0] });
    } catch (e) {
      return sendError(res, e);
    }
  }
);

app.get("/api/jobs", async (req, res) => {
  const r = await pool.query(
    "SELECT * FROM jobs ORDER BY created_at DESC"
  );
  res.json(r.rows);
});

app.get("/api/jobs/:id", async (req, res) => {
  const r = await pool.query(
    "SELECT * FROM jobs WHERE id=$1",
    [req.params.id]
  );

  res.json({ ok: true, job: r.rows[0] });
});

// ==============================
// START SERVER
// ==============================
const port = process.env.PORT || 3001;
app.listen(port, () => console.log("API running on", port));
