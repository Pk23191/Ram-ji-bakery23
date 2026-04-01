const express = require("express");
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");
const superAdminMiddleware = require("../middleware/superAdminMiddleware");
const {
  login,
  getAdmins,
  createAdmin,
  deleteAdmin
} = require("../controllers/fileAdminController");

const router = express.Router();

router.post("/login", login);
router.get("/", auth, adminMiddleware, getAdmins);
router.post("/create", auth, superAdminMiddleware, createAdmin);
router.delete("/:id", auth, superAdminMiddleware, deleteAdmin);

module.exports = router;
