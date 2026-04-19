const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readJson, writeJson } = require("../utils/fileStore");

const USERS_FILE = path.join(__dirname, "..", "data", "users.json");

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function issueToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role || "customer" },
    process.env.JWT_SECRET || "ramji-bakery-dev-secret",
    { expiresIn: "7d" }
  );
}

function issueCustomerToken(customer) {
  return jwt.sign(
    {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      role: "customer"
    },
    process.env.JWT_SECRET || "ramji-bakery-dev-secret",
    { expiresIn: "7d" }
  );
}

async function signup(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const users = await readJson(USERS_FILE, []);
    const exists = users.find((user) => user.email === email);
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      email,
      password: passwordHash,
      role: "customer",
      emailVerified: false,
      createdAt: new Date().toISOString()
    };

    users.unshift(user);
    await writeJson(USERS_FILE, users);

    return res.status(201).json({
      message: "Signup successful",
      token: issueToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Signup failed:", error);
    return res.status(500).json({ message: "Unable to signup" });
  }
}

async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const users = await readJson(USERS_FILE, []);
    const user = users.find((item) => item.email === email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      message: "Login successful",
      token: issueToken(user),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Unable to login" });
  }
}

async function customerLogin(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const customer = {
      id: `cust-${phone}`,
      name,
      phone,
      role: "customer"
    };

    return res.json({
      message: "Customer session ready",
      token: issueCustomerToken(customer),
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        role: customer.role
      }
    });
  } catch (error) {
    console.error("Customer login failed:", error);
    return res.status(500).json({ message: "Unable to login" });
  }
}

async function getProfile(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const users = await readJson(USERS_FILE, []);
    const user = users.find((item) => item.id === req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: Boolean(user.emailVerified)
      }
    });
  } catch (error) {
    console.error("Get profile failed:", error);
    return res.status(500).json({ message: "Unable to load profile" });
  }
}

async function forgotPassword(req, res) {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const users = await readJson(USERS_FILE, []);
    const userIndex = users.findIndex((item) => item.email === email);
    if (userIndex === -1) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = Date.now() + 15 * 60 * 1000;

    users[userIndex] = {
      ...users[userIndex],
      resetToken,
      resetTokenExpires
    };

    await writeJson(USERS_FILE, users);

    const resetLink = `${process.env.FRONTEND_URL || "https://ram-ji-bakery23.vercel.app"}/reset-password/${resetToken}`;
    console.log("Password reset token generated:", { email, resetToken, resetTokenExpires });

    return res.json({
      message: "Password reset link generated",
      resetLink
    });
  } catch (error) {
    console.error("Forgot password failed:", error);
    return res.status(500).json({ message: "Unable to process forgot password request" });
  }
}

async function resetPassword(req, res) {
  try {
    const token = String(req.body.token || "").trim();
    const newPassword = String(req.body.newPassword || req.body.password || "");

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const users = await readJson(USERS_FILE, []);
    const userIndex = users.findIndex(
      (item) => item.resetToken === token && Number(item.resetTokenExpires) > Date.now()
    );

    if (userIndex === -1) {
      return res.status(400).json({ message: "Reset token is invalid or expired" });
    }

    console.log("Password reset attempt:", { email: users[userIndex].email, token });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    users[userIndex] = {
      ...users[userIndex],
      password: passwordHash,
      resetToken: null,
      resetTokenExpires: null,
      passwordUpdatedAt: new Date().toISOString()
    };

    await writeJson(USERS_FILE, users);

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password failed:", error);
    return res.status(500).json({ message: "Unable to reset password" });
  }
}

module.exports = {
  signup,
  login,
  customerLogin,
  getProfile,
  forgotPassword,
  resetPassword
};
