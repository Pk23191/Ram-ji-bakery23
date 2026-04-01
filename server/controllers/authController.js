const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Customer = require("../models/Customer");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendAccountEmail } = require("../utils/email");

const OTP_EXPIRY_MINUTES = 5;

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

function hashOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function buildAppUrl(path = "") {
  const base = process.env.PUBLIC_STORE_URL || "http://localhost:3000";
  return `${base}${path}`;
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role || "admin" },
      process.env.JWT_SECRET || "ramji-bakery-dev-secret",
      { expiresIn: "1d" }
    );
    return res.json({ token, admin: { email: admin.email, role: admin.role || "admin" } });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(500).json({ message: "Login failed" });
  }
}

async function customerLogin(req, res) {
  try {
    const { name, phone } = req.body;

    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    const normalizedPhone = phone.trim();
    const normalizedName = name.trim();

    const customer = await Customer.findOneAndUpdate(
      { phone: normalizedPhone },
      { name: normalizedName, phone: normalizedPhone, role: "customer" },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const token = jwt.sign(
      { id: customer._id, name: normalizedName, phone: normalizedPhone, role: "customer" },
      process.env.JWT_SECRET || "ramji-bakery-dev-secret",
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      customer: {
        id: customer._id,
        name: normalizedName,
        phone: normalizedPhone,
        role: "customer"
      }
    });
  } catch (error) {
    console.error("Customer login failed:", error);
    return res.status(500).json({ message: "Login failed" });
  }
}

async function sendOtp(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otpCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    const codeHash = hashOtp(otpCode);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await Otp.findOneAndUpdate(
      { email },
      { email, codeHash, expiresAt },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    try {
      await sendAccountEmail({
        to: email,
        subject: "Your Ramji Bakery login code",
        text: `Your OTP is ${otpCode}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`
      });
    } catch (error) {
      console.error("OTP email failed", error.message);
    }

    return res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP failed:", error);
    return res.status(500).json({ message: "Unable to send OTP" });
  }
}

async function verifyOtp(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const code = String(req.body.code || "").trim();
    const name = String(req.body.name || "").trim();

    if (!email || !code) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const codeHash = hashOtp(code);
    const now = new Date();

    const otpEntry = await Otp.findOne({ email, codeHash, expiresAt: { $gt: now } });
    if (!otpEntry) {
      return res.status(400).json({ message: "OTP is invalid or expired" });
    }

    await Otp.deleteMany({ email });

    const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
    const user = await User.findOneAndUpdate(
      { email },
      {
        name: name || email.split("@")[0],
        email,
        emailVerified: true,
        password: passwordHash,
        role: "customer"
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({
      token: issueUserToken(user),
      user: buildUserResponse(user)
    });
  } catch (error) {
    console.error("Verify OTP failed:", error);
    return res.status(500).json({ message: "Unable to verify OTP" });
  }
}

async function verifyEmailFromQuery(req, res) {
  try {
    const token = String(req.query.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date();

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: now }
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

    return res.redirect(buildAppUrl("/verify-email?status=success"));
  } catch (error) {
    console.error("Verify email failed:", error);
    return res.status(500).json({ message: "Unable to verify email" });
  }
}

function handleGoogleCallback(req, res) {
  const user = req.user;
  if (!user) {
    return res.redirect(buildAppUrl("/login?google=failed"));
  }

  const token = issueUserToken(user);
  const redirectUrl = new URL(buildAppUrl("/login"));
  redirectUrl.searchParams.set("token", token);
  redirectUrl.searchParams.set("email", user.email);
  redirectUrl.searchParams.set("name", user.name || "");

  return res.redirect(redirectUrl.toString());
}

module.exports = {
  login,
  customerLogin,
  sendOtp,
  verifyOtp,
  verifyEmailFromQuery,
  handleGoogleCallback
};
