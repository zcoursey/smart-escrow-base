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
// ✅ ERROR VISIBILITY (backend logs + optional debug in response)
// ==============================
const isProd = process.env.NODE_ENV === "production";
// Set SHOW_ERRORS=true on Render to include debug details in JSON responses
const showErrors = !isProd || process.env.SHOW_ERRORS === "true";

function sendError(res, err, status = 500, publicMessage = "server error") {
  // Always log full details on the backend
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

  // Only include internals when allowed
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
// ✅ CORS CONFIG (supports Vercel previews)
// ==============================
const ALLOWED_ORIGINS = [
  process.env.WEB_ORIGIN,      // main frontend URL
  process.env.WEB_ORIGIN_ALT,  // optional second URL
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://localhost:3001",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
].filter(Boolean);

// Allow any Vercel preview for this project/account:
// Example: https://smart-escrow-base-demo-xxxx-lucas-shavers-projects.vercel.app
const VERCEL_PREVIEW_REGEX =
  /^https:\/\/smart-escrow-base-demo-.*-lucas-shavers-projects\.vercel\.app$/;

app.use(
  cors({
    origin: (origin, callback) => {
      // allow Postman/curl (no Origin header)
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

// Preflight
app.options("*", cors());

// Log CORS blocks (so you actually see them in Render logs)
app.use((err, req, res, next) => {
  if (String(err?.message || "").startsWith("CORS blocked")) {
    console.error("❌ CORS:", err.message, "Origin:", req.headers.origin);
    return res.status(403).json({ ok: false, error: "CORS blocked", debug: err.message });
  }
  next(err);
});

// ==============================
// ✅ DATABASE (Neon)
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
  if (!token) return res.status(401).json({ ok: false, error: "not authenticated" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return sendError(res, e, 401, "invalid token");
  }
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
      return res.status(400).json({ ok: false, error: "username, password, and role required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: "password must be at least 6 chars" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const r = await pool.query(
      "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at",
      [username, password_hash]
    );

    const user = r.rows[0];

    await pool.query(
      "INSERT INTO profiles (user_id, role) VALUES ($1, $2)",
      [user.id, role]
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
    // Postgres unique violation
    if (e?.code === "23505" || String(e).includes("duplicate key")) {
      return sendError(res, e, 409, "username already taken");
    }
    return sendError(res, e, 500, "register failed");
  }
});

//Add jobs
app.post("/api/jobs", async (req, res) => {
  try {
    const { client_id, title, description, location, budget } = req.body;

    // Basic validation
    if (!client_id || !title || !description) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    const r = await pool.query(
      "INSERT INTO jobs (client_id, title, description, location, budget) VALUES ($1, $2, $3, $4, $5) RETURNING *",
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
      "SELECT id, client_id, title, description, location, budget, status, created_at FROM jobs ORDER BY created_at DESC"
    );
    // Returning the array of jobs directly to easily map it in React
    res.json(r.rows); 
  } catch (e) {
    return sendError(res, e, 500, "failed to fetch jobs");
  }
});

// ==============================
// ✅ JOB APPLICATION ROUTES
// ==============================

// 1. Get a single job AND its applications
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Fetch the job details
    const jobRes = await pool.query(`
      SELECT j.*, e.contract_address, e.status as escrow_db_status 
      FROM jobs j
      LEFT JOIN escrows e ON j.id = e.job_id
      WHERE j.id = $1
    `, [jobId]);
    
    if (jobRes.rows.length === 0) return res.status(404).json({ ok: false, error: "Job not found" });
    const job = jobRes.rows[0];

    // Fetch the applicants for this job (joining with users table to get usernames)
    const appsRes = await pool.query(`
      SELECT a.id, a.contractor_id, a.application_status as status, a.created_at, u.username 
      FROM job_applications a
      JOIN users u ON a.contractor_id = u.id
      WHERE a.job_id = $1
      ORDER BY a.created_at ASC
    `, [jobId]);

    res.json({ ok: true, job, applications: appsRes.rows });
  } catch (e) {
    return sendError(res, e, 500, "failed to fetch job details");
  }
});

// 2. Contractor applies for a job
app.post("/api/jobs/:id/apply", authMiddleware, async (req, res) => {
  try {
    const jobId = req.params.id;
    const contractorId = req.user.sub;

    const r = await pool.query(
      "INSERT INTO job_applications (job_id, contractor_id) VALUES ($1, $2) RETURNING *",
      [jobId, contractorId]
    );

    res.json({ ok: true, application: r.rows[0] });
  } catch (e) {
    // Catch the UNIQUE constraint violation if they already applied
    if (e.code === '23505') {
      return res.status(400).json({ ok: false, error: "You have already applied for this job." });
    }
    return sendError(res, e, 500, "failed to submit application");
  }
});

//Get job applications posted by the contractor
app.get("/api/users/me/applications", authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT a.id as application_id, a.application_status as status, a.created_at as applied_at,
             j.id as job_id, j.title, j.budget
      FROM job_applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.contractor_id = $1
      ORDER BY a.created_at DESC
    `, [req.user.sub]);
    
    res.json({ ok: true, applications: r.rows });
  } catch (e) {
    return sendError(res, e, 500, "failed to fetch user applications");
  }
});

// Accept an application, reject others, and update the job status
app.put("/api/applications/:id/accept", authMiddleware, async (req, res) => {
  const client = await pool.connect(); // Use a dedicated client for transactions
  try {
    const appId = req.params.id;
    const { escrow_address } = req.body;
    
    // 1. Get the job_id for this application
    const appRes = await client.query("SELECT job_id FROM job_applications WHERE id = $1", [appId]);
    if (appRes.rows.length === 0) {
        return res.status(404).json({ ok: false, error: "Application not found" });
    }
    const jobId = appRes.rows[0].job_id;

    // Start Transaction
    await client.query('BEGIN');

    // 2. Mark the chosen application as 'accepted'
    await client.query(
      "UPDATE job_applications SET application_status = 'accepted' WHERE id = $1",
      [appId]
    );

    // 3. Automatically reject all OTHER applications for this exact job
    await client.query(
      "UPDATE job_applications SET application_status = 'rejected' WHERE job_id = $1 AND id != $2",
      [jobId, appId]
    );

    // 4. Update the Job status to 'in_progress' and save the escrow address
    // (Ensure your 'jobs' table has an 'escrow_address' column, or remove it from this query if not)
    await client.query(
      "UPDATE jobs SET status = 'in_progress' WHERE id = $1",
      [jobId]
    );

    //5. Saves Web3 escrow address to the escrows db. 
    // db has default values chain_id = 84532, status=0, and wei amount='0'
    await client.query(
      "INSERT INTO escrows (job_id, contract_address) VALUES ($1, $2)",
      [jobId, escrow_address]
    );

    // Commit the changes to the database
    await client.query('COMMIT');
    res.json({ ok: true });

  } catch (e) {
    await client.query('ROLLBACK'); // Cancel everything if one part fails
    return sendError(res, e, 500, "failed to accept application");
  } finally {
    client.release();
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ ok: false, error: "username and password required" });
    }

    const r = await pool.query(
      "SELECT id, username, password_hash, created_at FROM users WHERE username = $1",
      [username]
    );

    const user = r.rows[0];
    if (!user) return res.status(401).json({ ok: false, error: "invalid credentials" });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ ok: false, error: "invalid credentials" });

    const token = signToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      ok: true,
      user: { id: user.id, username: user.username, created_at: user.created_at },
    });
  } catch (e) {
    return sendError(res, e, 500, "login failed");
  }
});

// Who am I
app.get("/auth/me", authMiddleware, (req, res) => {
  res.json({
    ok: true,
    user: { id: req.user.sub, username: req.user.username },
  });
});

//Get profile, join for the username and profile data
app.get("/api/users/profile", authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT u.id, u.username, u.created_at, p.bio, p.wallet as wallet_address, p.role 
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1
    `, [req.user.sub]);

    if (r.rows.length === 0) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    res.json({ ok: true, profile: r.rows[0] });
  } catch (e) {
    return sendError(res, e, 500, "failed to fetch profile");
  }
});

// UPDATE Profile (Upsert into the profiles table)
app.put("/api/users/profile", authMiddleware, async (req, res) => {
  try {

    const { bio, wallet_address } = req.body; 

    const r = await pool.query(`
      INSERT INTO profiles (user_id, bio, wallet) 
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) 
      DO UPDATE SET bio = EXCLUDED.bio, wallet = EXCLUDED.wallet
      RETURNING bio, wallet as wallet_address
    `, [req.user.sub, bio, wallet_address]);

    res.json({ ok: true, profile: r.rows[0] });
  } catch (e) {
    return sendError(res, e, 500, "failed to update profile");
  }
});

// Get all contractors
app.get("/api/contractors", async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT u.id, u.username, p.bio, p.wallet as wallet_address, p.role 
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE p.role = 'contractor'
      ORDER BY u.created_at DESC
    `);

    res.json({ ok: true, contractors: r.rows });
  } catch (e) {
    return sendError(res, e, 500, "failed to fetch contractors");
  }
});

// Get jobs posted by the user
app.get("/api/users/me/jobs", authMiddleware, async (req, res) => {
  try {
   const r = await pool.query(`
      SELECT 
        j.id, 
        j.title, 
        j.budget, 
        j.status, 
        j.created_at,
        (SELECT COUNT(*) FROM job_applications a WHERE a.job_id = j.id) as applicant_count
      FROM jobs j 
      WHERE j.client_id = $1 
      ORDER BY j.created_at DESC
    `, [req.user.sub]);
    
    res.json({ ok: true, jobs: r.rows });
  } catch (e) {
    return sendError(res, e, 500, "failed to fetch user jobs");
  }
});

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

// 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "not found", path: req.path });
});

// Global error handler (sync/express errors)
app.use((err, req, res, next) => {
  return sendError(res, err, 500, "unhandled server error");
});

// ==============================
// ✅ START SERVER
// ==============================
const port = process.env.PORT || 3001;
app.listen(port, () => console.log("API running on", port));
