const path = require("path");
const { readJson } = require("../utils/fileStore");

const ORDERS_FILE = path.join(__dirname, "..", "data", "orders.json");

function parseOrderDate(order) {
  const value = order?.orderTime || order?.createdAt || order?.updatedAt;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildSalesByDay(orders, days = 7) {
  const today = new Date();
  const map = new Map();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    map.set(formatDate(date), 0);
  }

  orders.forEach((order) => {
    const date = parseOrderDate(order);
    if (!date) return;
    const key = formatDate(date);
    if (map.has(key)) {
      map.set(key, map.get(key) + Number(order.total || 0));
    }
  });

  return Array.from(map.entries()).map(([date, sales]) => ({ date, sales }));
}

async function getDashboard(req, res) {
  try {
    const orders = await readJson(ORDERS_FILE, []);
    const revenueOrders = orders.filter((order) => order.status !== "Cancelled");

    const today = new Date();
    const totalSales = revenueOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalOrders = orders.length;
    const todaySales = revenueOrders.reduce((sum, order) => {
      const date = parseOrderDate(order);
      return date && isSameDay(date, today) ? sum + Number(order.total || 0) : sum;
    }, 0);
    const monthlySales = revenueOrders.reduce((sum, order) => {
      const date = parseOrderDate(order);
      return date &&
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth()
        ? sum + Number(order.total || 0)
        : sum;
    }, 0);

    return res.json({
      totalSales,
      todaySales,
      monthlySales,
      totalOrders,
      salesByDay: buildSalesByDay(revenueOrders, 7)
    });
  } catch (error) {
    console.error("Dashboard load failed:", error);
    return res.status(500).json({ message: "Unable to load dashboard" });
  }
}

module.exports = { getDashboard };
