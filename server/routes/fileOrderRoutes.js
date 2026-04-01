const express = require("express");
const auth = require("../middleware/auth");
const adminMiddleware = require("../middleware/adminMiddleware");
const {
  createOrder,
  getOrders,
  updateOrderStatus,
  cancelOrder
} = require("../controllers/fileOrderController");

const router = express.Router();

router.post("/order", createOrder);
router.get("/orders", auth, getOrders);
router.put("/orders/:id/status", auth, adminMiddleware, updateOrderStatus);
router.put("/orders/:id/cancel", auth, cancelOrder);
router.patch("/order/:id/cancel", auth, cancelOrder);

module.exports = router;
