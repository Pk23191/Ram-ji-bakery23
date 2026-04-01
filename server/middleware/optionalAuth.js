const jwt = require("jsonwebtoken");

module.exports = function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "ramji-bakery-dev-secret");
  } catch (error) {
    // Ignore invalid tokens for optional auth.
  }

  return next();
};
