const express = require("express");
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");
const { listCoupons, applyCoupon, createCoupon, deleteCoupon } = require("../controllers/fileCouponController");

const router = express.Router();

router.get("/", listCoupons);
router.post("/apply", applyCoupon);
router.post("/", auth, adminMiddleware, createCoupon);
router.delete("/:code", auth, adminMiddleware, deleteCoupon);

module.exports = router;
