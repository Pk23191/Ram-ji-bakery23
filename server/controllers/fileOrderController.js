const path = require("path");
const { readJson, writeJson } = require("../utils/fileStore");
const { getOwnerNotificationTargets } = require("../utils/ownerContact");
const { buildWhatsAppUrl } = require("../utils/whatsapp");
const { sendOrderEmail } = require("../utils/email");

const ORDERS_FILE = path.join(__dirname, "..", "data", "orders.json");

function buildOrderPayload(body = {}) {
  const items = Array.isArray(body.items) ? body.items : [];
  const itemsTotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  return {
    orderId: body.orderId || `RB${Date.now().toString().slice(-6)}`,
    customer: body.customer || body.name || "Customer",
    customerEmail: body.customerEmail || "",
    phone: body.phone || "",
    address: body.address || "",
    paymentMethod: body.paymentMethod || "COD",
    status: body.status || "Pending",
    total: Number(body.total || itemsTotal || 0),
    items,
    orderTime: body.orderTime || new Date().toISOString()
  };
}

const STATUS_FLOW = ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

async function createOrder(req, res) {
  try {
    const payload = buildOrderPayload(req.body || {});
    const orders = await readJson(ORDERS_FILE, []);
    const order = {
      ...payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    orders.unshift(order);
    await writeJson(ORDERS_FILE, orders);
    let whatsappUrl = "";
    let emailStatus = { skipped: true };

    try {
      const { whatsappPhone, email } = getOwnerNotificationTargets();
      const itemsLine = (order.items || [])
        .map((item) => {
          const qty = Number(item.quantity || 1);
          const price = Number(item.price || 0);
          const image = item.image ? ` | ${item.image}` : "";
          return `- ${item.name || "Product"} x${qty} (₹${price})${image}`;
        })
        .join("\n");

      const message = [
        "New Order 🧁",
        `Order ID: ${order.orderId}`,
        `Customer: ${order.customer}`,
        `Phone: ${order.phone}`,
        order.address ? `Address: ${order.address}` : null,
        itemsLine ? `Items:\n${itemsLine}` : "Items: -",
        `Total: ₹${order.total}`
      ]
        .filter(Boolean)
        .join("\n");

      whatsappUrl = buildWhatsAppUrl(whatsappPhone, message);
      emailStatus = await sendOrderEmail({
        to: email,
        subject: `New Order - ${order.orderId}`,
        text: message
      });
    } catch (notifyError) {
      console.error("Order notification failed:", notifyError);
    }

    return res.status(201).json({
      message: "Order saved",
      order,
      whatsappUrl,
      emailStatus
    });
  } catch (error) {
    console.error("Create order failed:", error);
    return res.status(500).json({ message: "Unable to save order" });
  }
}

async function getOrders(req, res) {
  try {
    const orders = await readJson(ORDERS_FILE, []);
    const isAdmin = ["admin", "superadmin"].includes(req.user?.role || "");
    const email = isAdmin ? req.query.email || "" : req.user?.email || req.query.email || "";
    const phone = isAdmin ? req.query.phone || "" : req.user?.phone || req.query.phone || "";

    const filtered = email
      ? orders.filter((order) => order.customerEmail === email)
      : phone
        ? orders.filter((order) => order.phone === phone)
        : orders;

    return res.json(filtered);
  } catch (error) {
    console.error("Get orders failed:", error);
    return res.status(500).json({ message: "Unable to load orders" });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.id;
    const status = String(req.body.status || "");

    if (!STATUS_FLOW.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const orders = await readJson(ORDERS_FILE, []);
    const index = orders.findIndex((order) => order.orderId === orderId || order.id === orderId);
    if (index < 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    orders[index] = {
      ...orders[index],
      status,
      updatedAt: new Date().toISOString()
    };

    await writeJson(ORDERS_FILE, orders);
    return res.json({ message: "Order status updated", order: orders[index] });
  } catch (error) {
    console.error("Update order status failed:", error);
    return res.status(500).json({ message: "Unable to update order status" });
  }
}

async function cancelOrder(req, res) {
  try {
    const orderId = req.params.id;
    const reason = String(req.body.reason || "").trim();

    if (!reason) {
      return res.status(400).json({ message: "Cancel reason is required" });
    }

    const orders = await readJson(ORDERS_FILE, []);
    const index = orders.findIndex((order) => order.orderId === orderId || order.id === orderId);
    if (index < 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    orders[index] = {
      ...orders[index],
      status: "Cancelled",
      cancelReason: reason,
      cancelledBy: ["admin", "superadmin"].includes(req.user?.role) ? "admin" : "customer",
      updatedAt: new Date().toISOString()
    };

    await writeJson(ORDERS_FILE, orders);
    return res.json({ message: "Order cancelled", order: orders[index] });
  } catch (error) {
    console.error("Cancel order failed:", error);
    return res.status(500).json({ message: "Unable to cancel order" });
  }
}

module.exports = {
  createOrder,
  getOrders,
  updateOrderStatus,
  cancelOrder
};
