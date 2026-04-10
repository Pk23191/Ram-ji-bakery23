const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("express-async-errors");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const contactRoutes = require("./contactRoutes");
const productRoutes = require("./productRoutes");
const fileAuthRoutes = require("./fileAuthRoutes");
const fileOrderRoutes = require("./fileOrderRoutes");
const fileAdminRoutes = require("./fileAdminRoutes");
const fileReviewRoutes = require("./fileReviewRoutes");
const fileDashboardRoutes = require("./fileDashboardRoutes");
const fileUserRoutes = require("./fileUserRoutes");
const fileCouponRoutes = require("./fileCouponRoutes");
const { getCloudinaryConfigError } = require("../config/cloudinary");
const uploadRoutes = require("./upload");
const uploadLegacyRoutes = require("./uploadRoutes");
const bannerRoutes = require("./bannerRoutes");
const imageRoutes = require("./imageRoutes");
const { readJson, writeJson } = require("../utils/fileStore");

const app = express();
let server;

app.set("trust proxy", 1);

// Core middleware for API requests and media uploads.
const allowedOrigins = [
  "https://ram-ji-bakery23.vercel.app",
  "https://ram-ji-bakery.vercel.app",
  process.env.FRONTEND_URL,
  process.env.PUBLIC_STORE_URL
].filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return cb(null, true);

      // Allow any localhost for development
      if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);

      // Explicit allow-list (use FRONTEND_URL / PUBLIC_STORE_URL env vars)
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // Allow Vercel preview domains
      if (/\.vercel\.app$/.test(origin)) return cb(null, true);

      // Otherwise reject CORS (safer in production)
      return cb(new Error("CORS not allowed for origin: " + origin), false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
    optionsSuccessStatus: 200
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Serve uploaded static files from the project root `uploads/` directory.
// Using process.cwd() makes the path consistent when running from different working dirs.
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// API route registration.
app.use("/api/contact", contactRoutes);
app.use("/api/products", productRoutes);
app.use("/api/auth", fileAuthRoutes);
app.use("/api", fileOrderRoutes);
app.use("/api/admin", fileAdminRoutes);
app.use("/api/reviews", fileReviewRoutes);
app.use("/api/dashboard", fileDashboardRoutes);
app.use("/api/users", fileUserRoutes);
app.use("/api/coupons", fileCouponRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/uploads", uploadLegacyRoutes);
app.use("/api/banner", bannerRoutes);
app.use("/api/images", imageRoutes);

app.get("/api/health", (req, res) => {
  const readyState = mongoose.connection.readyState;
  res.json({ ok: true, service: "Ramji Bakery API", dbConnected: readyState === 1, readyState });
});

app.get("/api/test-db", (req, res) => {
  const readyState = mongoose.connection.readyState;
  res.json({
    ok: readyState === 1,
    dbConnected: readyState === 1,
    readyState
  });
});

app.use(["/api/settings"], (req, res) => {
  res.status(501).json({ message: "MongoDB has been removed from this project. These endpoints are disabled." });
});

// 404 handler for non-matching routes
app.use((req, res) => {
  // If this looks like an API or uploads request, return JSON 404.
  if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
    return res.status(404).json({ ok: false, message: "Route not found" });
  }

  // For browser navigation requests, redirect to the frontend store URL so Next.js can handle client routing.
  const frontendUrl = process.env.PUBLIC_STORE_URL || process.env.FRONTEND_URL || "https://ram-ji-bakery.vercel.app";

  if (req.accepts("html")) {
    const target = frontendUrl.replace(/\/$/, "") + req.originalUrl;
    return res.redirect(target);
  }

  // Fallback to JSON for non-HTML clients.
  res.status(404).json({ ok: false, message: "Route not found" });
});

// Unified error handler for cleaner production responses.
app.use((error, req, res, next) => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || "Server error";
  console.error("ERROR_HANDLER:", { status, message, stack: error?.stack });
  res.status(status).json({ ok: false, message });
});

const PORT = process.env.PORT || 5000;
const ADMINS_FILE = path.join(__dirname, "data", "admins.json");

async function ensureDefaultAdmin() {
  try {
    const admins = await readJson(ADMINS_FILE, []);
    if (admins.length) return;

    const email = process.env.ADMIN_EMAIL || "admin@ramjibakery.in";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    const role = ["admin", "superadmin"].includes(process.env.ADMIN_ROLE) ? process.env.ADMIN_ROLE : "superadmin";
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      password: passwordHash,
      role,
      createdAt: new Date().toISOString()
    };

    await writeJson(ADMINS_FILE, [admin]);
    console.log(`Admin seeded: ${email} (${role})`);
  } catch (error) {
    console.error("Admin seed failed:", error);
  }
}
function closeServerAndExit(exitCode = 0) {
  if (!server) {
    process.exit(exitCode);
    return;
  }

  server.close(() => {
    process.exit(exitCode);
  });

  setTimeout(() => process.exit(exitCode), 3000).unref();
}

function registerShutdownHandlers() {
  process.on("SIGINT", () => closeServerAndExit(0));
  process.on("SIGTERM", () => closeServerAndExit(0));
  process.once("SIGUSR2", () => {
    if (!server) {
      process.kill(process.pid, "SIGUSR2");
      return;
    }

    server.close(() => {
      process.kill(process.pid, "SIGUSR2");
    });

    setTimeout(() => process.kill(process.pid, "SIGUSR2"), 3000).unref();
  });
}

async function startServer() {
  // Fail fast if JWT_SECRET is missing in production
  if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === "production") {
      console.error("❌ FATAL: JWT_SECRET is not set. Authentication will fail for all users.");
      console.error("   Set JWT_SECRET in your Render environment variables.");
    } else {
      console.warn("⚠️  JWT_SECRET is not set — using dev fallback. Never do this in production!");
    }
  }

  await ensureDefaultAdmin();

  try {
    await connectDB();
  } catch (error) {
    console.error("MongoDB connection failed. Image persistence will be unavailable until this is fixed.");
  }

  const cloudinaryError = getCloudinaryConfigError();
  if (cloudinaryError) {
    console.warn("⚠️  WARNING:", cloudinaryError, "Product image uploads will fail until this is fixed.");
  } else {
    console.log("Cloudinary configured successfully.");
  }

  // --- Setup Env Validations ---
  const requiredEnv = [
    "MONGO_URI",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  ];

  requiredEnv.forEach((key) => {
    if (!process.env[key]) {
      console.error(`❌ Missing ENV: ${key}`);
    } else {
      console.log(`✅ ENV OK: ${key}`);
    }
  });

  console.log("🚀 Server running");
  console.log("🌍 Mode:", process.env.NODE_ENV || "development");

  server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use.`);
      closeServerAndExit(1);
      return;
    }

    console.error(error);
    closeServerAndExit(1);
  });
}

registerShutdownHandlers();
startServer();
