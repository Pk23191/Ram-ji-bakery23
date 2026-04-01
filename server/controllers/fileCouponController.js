const path = require("path");
const { readJson, writeJson } = require("../utils/fileStore");

const COUPONS_FILE = path.join(__dirname, "..", "data", "coupons.json");

function normalizeCode(code = "") {
  return String(code || "").trim().toUpperCase();
}

function isCouponActive(coupon) {
  if (!coupon || coupon.active === false) return false;
  if (!coupon.expiresAt) return true;
  const expiresAt = new Date(coupon.expiresAt);
  return Number.isNaN(expiresAt.getTime()) ? true : expiresAt.getTime() > Date.now();
}

async function listCoupons(req, res) {
  try {
    const coupons = await readJson(COUPONS_FILE, []);
    const activeCoupons = coupons.filter(isCouponActive);
    return res.json(activeCoupons.map((coupon) => ({
      code: coupon.code,
      discountPercent: Number(coupon.discountPercent || 0),
      active: coupon.active !== false,
      expiresAt: coupon.expiresAt || null
    })));
  } catch (error) {
    console.error("List coupons failed:", error);
    return res.status(500).json({ message: "Unable to load coupons" });
  }
}

async function applyCoupon(req, res) {
  try {
    const code = normalizeCode(req.body.code);
    const subtotal = Number(req.body.subtotal || 0);

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const coupons = await readJson(COUPONS_FILE, []);
    const coupon = coupons.find((item) => normalizeCode(item.code) === code);

    if (!coupon || !isCouponActive(coupon)) {
      return res.status(400).json({ message: "Invalid or expired coupon" });
    }

    const discountPercent = Math.min(Math.max(Number(coupon.discountPercent || 0), 0), 90);
    const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
    const total = Math.max(0, Number((subtotal - discountAmount).toFixed(2)));

    return res.json({
      code,
      discountPercent,
      discountAmount,
      total
    });
  } catch (error) {
    console.error("Apply coupon failed:", error);
    return res.status(500).json({ message: "Unable to apply coupon" });
  }
}

async function createCoupon(req, res) {
  try {
    const code = normalizeCode(req.body.code);
    const discountPercent = Math.min(Math.max(Number(req.body.discountPercent || 0), 0), 90);

    if (!code || !discountPercent) {
      return res.status(400).json({ message: "Coupon code and discount are required" });
    }

    const coupons = await readJson(COUPONS_FILE, []);
    const exists = coupons.find((item) => normalizeCode(item.code) === code);
    if (exists) {
      return res.status(400).json({ message: "Coupon already exists" });
    }

    const coupon = {
      code,
      discountPercent,
      active: true,
      createdAt: new Date().toISOString()
    };

    coupons.unshift(coupon);
    await writeJson(COUPONS_FILE, coupons);

    return res.status(201).json(coupon);
  } catch (error) {
    console.error("Create coupon failed:", error);
    return res.status(500).json({ message: "Unable to create coupon" });
  }
}

async function deleteCoupon(req, res) {
  try {
    const code = normalizeCode(req.params.code);
    const coupons = await readJson(COUPONS_FILE, []);
    const existing = coupons.find((item) => normalizeCode(item.code) === code);

    if (!existing) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const filtered = coupons.filter((item) => normalizeCode(item.code) !== code);
    await writeJson(COUPONS_FILE, filtered);
    return res.json({ message: "Coupon deleted" });
  } catch (error) {
    console.error("Delete coupon failed:", error);
    return res.status(500).json({ message: "Unable to delete coupon" });
  }
}

module.exports = {
  listCoupons,
  applyCoupon,
  createCoupon,
  deleteCoupon
};
