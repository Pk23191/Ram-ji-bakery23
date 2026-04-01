const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readJson, writeJson } = require("../utils/fileStore");

const ADMINS_FILE = path.join(__dirname, "..", "data", "admins.json");

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function issueAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role || "admin" },
    process.env.JWT_SECRET || "ramji-bakery-dev-secret",
    { expiresIn: "1d" }
  );
}

async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admins = await readJson(ADMINS_FILE, []);
    const admin = admins.find((item) => item.email === email);
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.json({
      token: issueAdminToken(admin),
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(500).json({ message: "Unable to login" });
  }
}

async function getAdmins(req, res) {
  try {
    const admins = await readJson(ADMINS_FILE, []);
    return res.json(
      admins.map((admin) => ({
        id: admin.id,
        email: admin.email,
        role: admin.role
      }))
    );
  } catch (error) {
    console.error("Get admins failed:", error);
    return res.status(500).json({ message: "Unable to load admins" });
  }
}

async function createAdmin(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const role = ["admin", "superadmin"].includes(req.body.role) ? req.body.role : "admin";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admins = await readJson(ADMINS_FILE, []);
    const exists = admins.find((item) => item.email === email);
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email,
      password: passwordHash,
      role,
      createdAt: new Date().toISOString()
    };

    admins.unshift(admin);
    await writeJson(ADMINS_FILE, admins);

    return res.status(201).json({
      message: "Admin created",
      admin: { id: admin.id, email: admin.email, role: admin.role }
    });
  } catch (error) {
    console.error("Create admin failed:", error);
    return res.status(500).json({ message: "Unable to create admin" });
  }
}

async function deleteAdmin(req, res) {
  try {
    const adminId = req.params.id;
    const admins = await readJson(ADMINS_FILE, []);
    const admin = admins.find((item) => item.id === adminId);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.role === "superadmin") {
      return res.status(400).json({ message: "Superadmin cannot be removed" });
    }

    const filtered = admins.filter((item) => item.id !== adminId);
    await writeJson(ADMINS_FILE, filtered);
    return res.json({ message: "Admin removed" });
  } catch (error) {
    console.error("Delete admin failed:", error);
    return res.status(500).json({ message: "Unable to remove admin" });
  }
}

module.exports = {
  login,
  getAdmins,
  createAdmin,
  deleteAdmin
};
