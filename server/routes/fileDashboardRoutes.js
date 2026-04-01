const express = require("express");
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");
const { getDashboard } = require("../controllers/fileDashboardController");

const router = express.Router();

router.get("/", auth, adminMiddleware, getDashboard);

module.exports = router;
