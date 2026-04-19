const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "ramji-bakery-dev-secret";

module.exports = function auth(req, res, next) {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
    console.error("FATAL: JWT_SECRET env var is not set in production!");
    return res.status(500).json({ message: "Server authentication misconfigured" });
  }

  const header = req.headers.authorization || "";

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = header.split(" ")[1];

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (error) {
    console.error("Token verification failed:", error && error.message ? error.message : error);
    return res.status(401).json({ message: "Invalid token" });
  }
};
