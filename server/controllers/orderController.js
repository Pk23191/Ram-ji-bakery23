const Order = require("../models/Order");
const Product = require("../models/Product");
const { getRecommendations } = require("../utils/recommendations");
const { buildWhatsAppLink, sendOrderEmail, sendWhatsAppCloudNotification } = require("../utils/orderNotifications");
const mongoose = require("mongoose");
const { calculateOrderTotals } = require("../utils/pricing");

const statusTransitions = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Preparing", "Cancelled"],
  Preparing: ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: []
};

function canCancelOrder(order) {
  return !["Out for Delivery", "Delivered", "Cancelled"].includes(order.status);
}

async function createOrder(req, res) {
  try {
    const orderTime = req.body.orderTime || new Date().toISOString();
    const orderId = `RB${Date.now().toString().slice(-6)}`;
    const pricing = calculateOrderTotals(req.body.items || []);
    const payload = {
      ...req.body,
      status: req.body.status || "Pending",
      orderId,
      orderTime,
      subtotal: pricing.subtotal,
      deliveryCharge: pricing.deliveryCharge,
      gstEnabled: false,
      gstRate: 0,
      gstAmount: 0,
      total: pricing.total
    };

    const order = await Order.create(payload);

    const whatsappUrl = buildWhatsAppLink(order);
    let emailSent = false;
    let whatsappSent = false;

    try {
      const emailStatus = await sendOrderEmail(order);
      emailSent = !emailStatus.skipped;
    } catch (error) {
      console.error("Order email failed", error.message);
    }

    try {
      const whatsappStatus = await sendWhatsAppCloudNotification(order);
      whatsappSent = !whatsappStatus.skipped;
    } catch (error) {
      console.error("WhatsApp notification failed", error.message);
    }

    return res.status(201).json({
      message: "Order saved and notifications processed",
      order,
      whatsappUrl,
      emailSent,
      whatsappSent
    });
  } catch (error) {
    console.error("Create order failed:", error);
    return res.status(500).json({ message: "Unable to place order" });
  }
}

async function getOrders(req, res) {
  try {
    const requestedPhone = req.query.phone?.trim();
    const requestedEmail = req.query.email?.trim().toLowerCase();
    const isAdmin = ["admin", "superadmin"].includes(req.user?.role || "");
    const isCustomer = req.user?.role === "customer";

    if (!isAdmin && !isCustomer) {
      return res.status(401).json({ message: "Login required to view orders" });
    }

    const phone = isCustomer ? req.user.phone : requestedPhone;
    const email = isCustomer ? req.user.email : requestedEmail;
    const filter = email
      ? { $or: [{ customerEmail: email }, ...(phone ? [{ phone }] : [])] }
      : phone
        ? { phone }
        : {};

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    return res.json(orders);
  } catch (error) {
    console.error("Get orders failed:", error);
    return res.status(500).json({ message: "Unable to load orders" });
  }
}

async function cancelOrder(req, res) {
  try {
    const orderId = req.params.orderId || req.params.id;
    const { reason, cancelledBy = "customer" } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ message: "Cancel reason is required" });
    }

    const orderLookup = mongoose.Types.ObjectId.isValid(orderId)
      ? { $or: [{ _id: orderId }, { orderId }] }
      : { orderId };

    const order = await Order.findOne(orderLookup);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (
      req.user?.role === "customer" &&
      order.phone !== req.user.phone &&
      (!req.user.email || order.customerEmail !== req.user.email)
    ) {
      return res.status(403).json({ message: "You can only cancel your own orders" });
    }

    if (!canCancelOrder(order)) {
      return res.status(400).json({ message: "This order can no longer be cancelled" });
    }

    const updates = {
      status: "Cancelled",
      cancelReason: reason.trim(),
      cancelledAt: new Date(),
      cancelledBy
    };

    const updatedOrder = await Order.findOneAndUpdate(orderLookup, updates, { new: true });

    return res.json({
      message: "Order cancelled successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Cancel order failed:", error);
    return res.status(500).json({ message: "Unable to cancel order" });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.orderId || req.params.id;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Order status is required" });
    }

    if (status === "Cancelled") {
      return res.status(400).json({ message: "Use the cancel order API to cancel this order" });
    }

    const orderLookup = mongoose.Types.ObjectId.isValid(orderId)
      ? { $or: [{ _id: orderId }, { orderId }] }
      : { orderId };

    const order = await Order.findOne(orderLookup);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const allowedTransitions = statusTransitions[order.status] || [];

    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({ message: `Order cannot move from ${order.status} to ${status}` });
    }

    const updates = {
      status,
      ...(status !== "Cancelled"
        ? {
            cancelReason: "",
            cancelledAt: null,
            cancelledBy: ""
          }
        : {})
    };

    const updatedOrder = await Order.findOneAndUpdate(orderLookup, updates, { new: true });

    return res.json({
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Update order status failed:", error);
    return res.status(500).json({ message: "Unable to update order status" });
  }
}

async function getRecommendationsForUser(req, res) {
  try {
    const products = await Product.find();
    const recentOrders = await Order.find({ phone: req.query.phone }).sort({ createdAt: -1 }).limit(5);
    const behaviorTags = (req.query.behavior || "").split(",").filter(Boolean);
    const recommendations = getRecommendations(products, recentOrders, behaviorTags);
    return res.json(recommendations);
  } catch (error) {
    console.error("Get recommendations failed:", error);
    return res.status(500).json({ message: "Unable to load recommendations" });
  }
}

module.exports = { createOrder, getOrders, cancelOrder, updateOrderStatus, getRecommendationsForUser };
