const express = require("express");
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");
const superAdminMiddleware = require("../middleware/superAdminMiddleware");
const {
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
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", auth, getProfile);
router.post("/verify-email", verifyEmail);
router.post("/verify-email/resend", auth, resendVerification);
router.post("/password/forgot", requestPasswordReset);
router.post("/password/reset", resetPassword);
router.get("/", auth, adminMiddleware, listUsers);
router.delete("/:id", auth, adminMiddleware, deleteUser);
router.patch("/:id/role", auth, superAdminMiddleware, updateUserRole);

module.exports = router;
