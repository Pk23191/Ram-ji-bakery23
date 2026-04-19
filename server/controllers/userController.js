const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { sendAccountEmail } = require("../utils/email");

const EMAIL_TOKEN_EXPIRY_HOURS = 24;
const RESET_TOKEN_EXPIRY_MINUTES = 30;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildAppUrl(path = "") {
  const base = process.env.PUBLIC_STORE_URL || process.env.FRONTEND_URL || "https://ram-ji-bakery.vercel.app";
  return `${base}${path}`;
}

function buildApiUrl(path = "") {
  const base = process.env.PUBLIC_API_URL || "https://ram-ji-bakery-43-public-1.onrender.com/api";
  return `${base}${path}`;
}

function createTokenPair() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashedToken };
}

function issueUserToken(user) {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "customer"
    },
    process.env.JWT_SECRET || "ramji-bakery-dev-secret",
    { expiresIn: "7d" }
  );
}

function buildUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || "customer",
    emailVerified: Boolean(user.emailVerified)
  };
}

async function registerUser(req, res) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rawToken, hashedToken } = createTokenPair();
    const emailVerificationExpires = new Date(Date.now() + EMAIL_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    let user;
    try {
      user = await User.create({
        name,
        email,
        password: passwordHash,
        role: "customer",
        emailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpires
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(400).json({ message: "An account with this email already exists" });
      }
      throw error;
    }

    try {
      await sendAccountEmail({
        to: email,
        subject: "Verify your Ramji Bakery account",
        text: `Verify your email to activate your account: ${buildApiUrl(`/auth/verify-email?token=${rawToken}`)}`
      });
    } catch (error) {
      console.error("Account verification email failed", error.message);
    }

    const token = issueUserToken(user);

    return res.status(201).json({
      token,
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error("Register user failed:", error);
    return res.status(500).json({ message: "Unable to create account" });
  }
}

async function loginUser(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return res.json({
      token: issueUserToken(user),
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error("Login user failed:", error);
    return res.status(500).json({ message: "Unable to login" });
  }
}

async function getProfile(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({ message: "Invalid session. Please login again." });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error("Get profile failed:", error);
    return res.status(500).json({ message: "Unable to load profile" });
  }
}

async function verifyEmail(req, res) {
  try {
    const token = String(req.body.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Verification token is invalid or expired" });
    }

    const updates = {
      emailVerified: true,
      emailVerificationToken: "",
      emailVerificationExpires: null
    };

    await User.findByIdAndUpdate(user._id, updates);

    return res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify email failed:", error);
    return res.status(500).json({ message: "Unable to verify email" });
  }
}

async function resendVerification(req, res) {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const { rawToken, hashedToken } = createTokenPair();
    const emailVerificationExpires = new Date(Date.now() + EMAIL_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      emailVerificationToken: hashedToken,
      emailVerificationExpires
    });

    try {
      await sendAccountEmail({
        to: user.email,
        subject: "Verify your Ramji Bakery account",
        text: `Verify your email to activate your account: ${buildApiUrl(`/auth/verify-email?token=${rawToken}`)}`
      });
    } catch (error) {
      console.error("Account verification email failed", error.message);
    }

    return res.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Resend verification failed:", error);
    return res.status(500).json({ message: "Unable to resend verification email" });
  }
}

async function requestPasswordReset(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found for this email" });
    }

    const { rawToken, hashedToken } = createTokenPair();
    const passwordResetExpires = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires
    });

    try {
      await sendAccountEmail({
        to: user.email,
        subject: "Reset your Ramji Bakery password",
        text: `Reset your password using this link: ${buildAppUrl(`/reset-password?token=${rawToken}`)}`
      });
    } catch (error) {
      console.error("Password reset email failed", error.message);
    }

    return res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Request password reset failed:", error);
    return res.status(500).json({ message: "Unable to request password reset" });
  }
}

async function resetPassword(req, res) {
  try {
    const token = String(req.body.token || "").trim();
    const newPassword = String(req.body.password || "");

    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Reset token is invalid or expired" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updates = {
      password: passwordHash,
      passwordResetToken: "",
      passwordResetExpires: null
    };

    await User.findByIdAndUpdate(user._id, updates);

    return res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password failed:", error);
    return res.status(500).json({ message: "Unable to reset password" });
  }
}

async function listUsers(req, res) {
  try {
    const users = await User.find().select("-password");
    return res.json(users.map(buildUserResponse));
  } catch (error) {
    console.error("List users failed:", error);
    return res.status(500).json({ message: "Unable to load users" });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user failed:", error);
    return res.status(500).json({ message: "Unable to delete user" });
  }
}

async function updateUserRole(req, res) {
  try {
    const userId = req.params.id;
    const role = String(req.body.role || "").trim();

    if (!["customer", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be customer or admin" });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: "User role updated",
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error("Update user role failed:", error);
    return res.status(500).json({ message: "Unable to update user role" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  listUsers,
  deleteUser,
  updateUserRole
};
