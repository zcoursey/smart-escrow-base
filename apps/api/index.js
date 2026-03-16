// apps/api/index.js
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

app.use(express.json());
app.use(cookieParser());

// ==============================
// ✅ ERROR VISIBILITY
// ==============================
const isProd = process.env.NODE_ENV === "production";
const showErrors = !isProd || process.env.SHOW_ERRORS === "true";

function sendError(res, err, status = 500, publicMessage = "server error") {
  console.error("❌ API ERROR:", {
    publicMessage,
    message: err?.message,
    code: err?.code,
    detail: err?.detail,
    where: err?.where,
    routine: err?.routine,
    stack: err?.stack,
  });

  const payload = { ok: false, error: publicMessage };

  if (showErrors) {
    payload.debug = {
      message: err?.message || String(err),
      code: err?.code,
      detail: err?.detail,
      where: err?.where,
      stack: err?.stack,
    };
  }

  return res.status(status).json(payload);
}

// ==============================
// ✅ CORS CONFIG
// ==============================
const ALLOWED_ORIGINS = [
  process.env.WEB_ORIGIN,
  process.env.WEB_ORIGIN_ALT,
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://localhost:3001",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);

const VERCEL_PREVIEW_REGEX =
  /^https:\/\/smart-escrow-base-demo-.*-lucas-shavers-projects\.vercel\.app$/;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      if (VERCEL_PREVIEW_REGEX.test(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use((err, req, res, next) => {
  if (String(err?.message || "").startsWith("CORS blocked")) {
    console.error("❌ CORS:", err.message, "Origin:", req.headers.origin);
    return res
      .status(403)
      .json({ ok: false, error: "CORS blocked", debug: err.message });
  }
  next(err);
});

// ==============================
// ✅ DATABASE
// ==============================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ==============================
// ✅ AUTH HELPERS
// ==============================
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ ok: false, error: "not authenticated" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return sendError(res, e, 401, "invalid token");
  }
}

function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const result = await pool.query(
        `
        SELECT r.name AS role
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
        `,
        [req.user.sub]
      );

      const user = result.rows[0];

      if (!user || !allowedRoles.includes(user.role)) {
        return res.status(403).json({ ok: false, error: "forbidden" });
      }

      req.user.role = user.role;
      next();
    } catch (e) {
      return sendError(res, e, 500, "authorization failed");
    }
  };
}

// ==============================
// ✅ ROUTES
// ==============================
app.get("/health", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW() as now");
    res.json({ ok: true, now: r.rows[0].now });
  } catch (e) {
    return sendError(res, e, 500, "database not reachable");
  }
});

// Register
app.post("/auth/register", async (req, res) => {
  try {
    const { username, password, role } = req.body || {};

    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ ok: false, error: "username, password, and role required" });
    }

    if (!["client", "contractor"].includes(role)) {
      return res.status(400).json({ ok: false, error: "invalid role" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ ok: false, error: "password must be at least 6 chars" });
    }

    const roleResult = await pool.query(
      "SELECT id FROM roles WHERE name = $1",
      [role]
    );

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ ok: false, error: "role not found" });
    }

    const role_id = roleResult.rows[0].id;
    const password_hash = await bcrypt.hash(password, 10);

    const r = await pool.query(
      `
      INSERT INTO users (username, password_hash, role_id)
      VALUES ($1, $2, $3)
      RETURNING id, username, created_at, role_id, wallet
      `,
      [username, password_hash, role_id]
    );

    const user = r.rows[0];

    await pool.query(
      `
      INSERT INTO profiles (user_id)
      VALUES ($1)
      ON CONFLICT (user_id) DO NOTHING
      `,
      [user.id]
    );

    const token = signToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ ok: true, user });
  } catch (e) {
    if (e?.code === "23505" || String(e).includes("duplicate key")) {
      return sendError(res, e, 409, "username already taken");
    }
    return sendError(res, e, 500, "register failed");
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "username and password required" });
    }

    const r = await pool.query(
      `
      SELECT id, username, password_hash, created_at, role_id, wallet
      FROM users
      WHERE username = $1
      `,
      [username]
    );

    const user = r.rows[0];
    if (!user) {
      return res.status(401).json({ ok: false, error: "invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ ok: false, error: "invalid credentials" });
    }

    const token = signToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at,
        wallet: user.wallet,
        role_id: user.role_id,
      },
    });
  } catch (e) {
    return sendError(res, e, 500, "login failed");
  }
});

// Who am I
app.get("/auth/me", authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `
      SELECT u.id, u.username, u.created_at, u.wallet, r.name AS role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
      `,
      [req.user.sub]
    );

    const user = r.rows[0];
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, user });
  } catch (e) {
    return sendError(res, e, 500, "failed to fetch current user");
  }
});

// Add jobs
app.post("/api/jobs", authMiddleware, requireRole("client"), async (req, res) => {
  try {
    const client_id = req.user.sub;
    const { title, description, location, budget } = req.body;

    if (!title || !description) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const r = await pool.query(
      `
      INSERT INTO jobs (client_id, title, description, location, budget)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [client_id, title, description, location, budget]
    );

    res.json({ ok: true, job: r.rows[0] });
  } catch (e) {
    return sendError(res, e, 500, "failed to create job");
  }
});

// Get all jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const r = await pool.query(
      `
      SELECT id, client_id, title, description, location, budget, status, created_at
      FROM jobs
      ORDER BY created_at DESC
      `
    );
    res.json(r.rows);
  } catch (e) {
    return sendError(res, e, 500, "failed to fetch jobs");
  }
});

// Get a single job and its applications
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const jobId = req.params.id;

    const jobRes = await pool.query(
      `
      SELECT j.*, e.contract_address, e.status AS escrow_db_status
      FROM jobs j
      LEFT JOIN escrows e ON j.id = e.job_id
      WHERE j.id = $1
      `,
      [jobId]
    );

    if (jobRes.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Job not found" });
    }

    const job = jobRes.rows[0];

    const appsRes = await pool.query(
      `
      SELECT a.id, a.contractor_id, a.application_status AS status, a.created_at, u.username
      FROM job_applications a
      JOIN users u ON a.contractor_id = u.id
      WHERE a.job_id = $1
      ORDER BY a.created_at ASC
      `,
      [jobId]
    );

    res.json({ ok: true, job, applications: appsRes.rows });
  } catch (e) {
    return sendError(res, e, 500, "failed to fetch job details");
  }
});

// Contractor applies for a job
app.post(
  "/api/jobs/:id/apply",
  authMiddleware,
  requireRole("contractor"),
  async (req, res) => {
    try {
      const jobId = req.params.id;
      const contractorId = req.user.sub;

      const r = await pool.query(
        `
        INSERT INTO job_applications (job_id, contractor_id)
        VALUES ($1, $2)
        RETURNING *
        `,
        [jobId, contractorId]
      );

      res.json({ ok: true, application: r.rows[0] });
    } catch (e) {
      if (e.code === "23505") {
        return res
          .status(400)
          .json({ ok: false, error: "You have already applied for this job." });
      }
      return sendError(res, e, 500, "failed to submit application");
    }
  }
);

// Get job applications posted by the contractor
app.get(
  "/api/users/me/applications",
  authMiddleware,
  requireRole("contractor"),
  async (req, res) => {
    try {
      const r = await pool.query(
        `
        SELECT
          a.id AS application_id,
          a.application_status AS status,
          a.created_at AS applied_at,
          j.id AS job_id,
          j.title,
          j.budget
        FROM job_applications a
        JOIN jobs j ON a.job_id = j.id
        WHERE a.contractor_id = $1
        ORDER BY a.created_at DESC
        `,
        [req.user.sub]
      );

      res.json({ ok: true, applications: r.rows });
    } catch (e) {
      return sendError(res, e, 500, "failed to fetch user applications");
    }
  }
);

// Accept an application
app.put(
  "/api/applications/:id/accept",
  authMiddleware,
  requireRole("client"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const appId = req.params.id;
      const { escrow_address } = req.body;

      const appRes = await client.query(
        `
        SELECT ja.job_id, j.client_id
        FROM job_applications ja
        JOIN jobs j ON ja.job_id = j.id
        WHERE ja.id = $1
        `,
        [appId]
      );

      if (appRes.rows.length === 0) {
        return res
          .status(404)
          .json({ ok: false, error: "Application not found" });
      }

      const { job_id: jobId, client_id: jobOwnerId } = appRes.rows[0];

      if (jobOwnerId !== req.user.sub) {
        return res.status(403).json({ ok: false, error: "forbidden" });
      }

      await client.query("BEGIN");

      await client.query(
        `
        UPDATE job_applications
        SET application_status = 'accepted'
        WHERE id = $1
        `,
        [appId]
      );

      await client.query(
        `
        UPDATE job_applications
        SET application_status = 'rejected'
        WHERE job_id = $1 AND id != $2
        `,
        [jobId, appId]
      );

      await client.query(
        `
        UPDATE jobs
        SET status = 'in_progress'
        WHERE id = $1
        `,
        [jobId]
      );

      await client.query(
        `
        INSERT INTO escrows (job_id, contract_address, status)
        VALUES ($1, $2, 'in_progress')
        `,
        [jobId, escrow_address]
      );

      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (e) {
      await client.query("ROLLBACK");
      return sendError(res, e, 500, "failed to accept application");
    } finally {
      client.release();
    }
  }
);

// Get profile
app.get("/api/users/profile", authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.created_at,
        u.wallet AS wallet_address,
        r.name AS role,
        p.bio
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
      `,
      [req.user.sub]
    );

    if (r.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, profile: r.rows[0] });
  } catch (e) {
    return sendError(res, e, 500, "failed to fetch profile");
  }
});

// Update profile
app.put("/api/users/profile", authMiddleware, async (req, res) => {
  try {
    const { bio, wallet_address } = req.body;

    await pool.query(
      `
      UPDATE users
      SET wallet = $1
      WHERE id = $2
      `,
      [wallet_address || null, req.user.sub]
    );

    const r = await pool.query(
      `
      INSERT INTO profiles (user_id, bio)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET bio = EXCLUDED.bio
      RETURNING bio
      `,
      [req.user.sub, bio || null]
    );

    res.json({
      ok: true,
      profile: {
        bio: r.rows[0].bio,
        wallet_address: wallet_address || null,
      },
    });
  } catch (e) {
    return sendError(res, e, 500, "failed to update profile");
  }
});

// Get all contractors
app.get("/api/contractors", async (req, res) => {
  try {
    const r = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.wallet AS wallet_address,
        p.bio,
        role.name AS role
      FROM users u
      JOIN roles role ON u.role_id = role.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE role.name = 'contractor'
      ORDER BY u.created_at DESC
      `
    );

    res.json({ ok: true, contractors: r.rows });
  } catch (e) {
    return sendError(res, e, 500, "failed to fetch contractors");
  }
});

// Get jobs posted by the current user
app.get(
  "/api/users/me/jobs",
  authMiddleware,
  requireRole("client"),
  async (req, res) => {
    try {
      const r = await pool.query(
        `
        SELECT
          j.id,
          j.title,
          j.budget,
          j.status,
          j.created_at,
          (
            SELECT COUNT(*)
            FROM job_applications a
            WHERE a.job_id = j.id
          ) AS applicant_count
        FROM jobs j
        WHERE j.client_id = $1
        ORDER BY j.created_at DESC
        `,
        [req.user.sub]
      );

      res.json({ ok: true, jobs: r.rows });
    } catch (e) {
      return sendError(res, e, 500, "failed to fetch user jobs");
    }
  }
);

// Logout
app.post("/auth/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  res.json({ ok: true });
});

// Optional: recent users
app.get("/auth/recent", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, username, created_at FROM users ORDER BY created_at DESC LIMIT 25"
    );
    res.json({ ok: true, users: r.rows });
  } catch (e) {
    return sendError(res, e, 500, "recent users fetch failed");
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "not found", path: req.path });
});

// Global error handler
app.use((err, req, res, next) => {
  return sendError(res, err, 500, "unhandled server error");
});

// ==============================
// ✅ START SERVER
// ==============================
const port = process.env.PORT || 3001;
app.listen(port, () => console.log("API running on", port));
