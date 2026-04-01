const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
require("express-async-errors");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");

const contactRoutes = require("./routes/contactRoutes");
const productRoutes = require("./routes/productRoutes");
const fileAuthRoutes = require("./routes/fileAuthRoutes");
const fileOrderRoutes = require("./routes/fileOrderRoutes");
const fileAdminRoutes = require("./routes/fileAdminRoutes");
const fileReviewRoutes = require("./routes/fileReviewRoutes");
const fileDashboardRoutes = require("./routes/fileDashboardRoutes");
const fileUserRoutes = require("./routes/fileUserRoutes");
const fileCouponRoutes = require("./routes/fileCouponRoutes");
const uploadRoutes = require("./routes/upload");
const uploadLegacyRoutes = require("./routes/uploadRoutes");
const { readJson, writeJson } = require("./utils/fileStore");

const app = express();
let server;

// Core middleware for API requests and media uploads.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "Ramji Bakery API", dbConnected: false, readyState: 0 });
});

app.get("/api/test-db", (req, res) => {
  res.json({
    ok: true,
    dbConnected: false,
    readyState: 0
  });
});

app.use(["/api/settings"], (req, res) => {
  res.status(501).json({ message: "MongoDB has been removed from this project. These endpoints are disabled." });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Unified error handler for cleaner production responses.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "Server error" });
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
  await ensureDefaultAdmin();
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
