const OWNER_WHATSAPP = process.env.NEXT_PUBLIC_ORDER_NOTIFICATION_WHATSAPP || "917566921100";
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || "anuragsahug689@gmail.com";

function buildItemsLine(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "Items: -";
  }

  const lines = items.map((item) => {
    const name = item.name || "Product";
    const qty = Number(item.quantity || 1);
    const price = Number(item.price || 0);
    const image = item.image ? ` | ${item.image}` : "";
    return `- ${name} x${qty} (₹${price})${image}`;
  });

  return `Items:\n${lines.join("\n")}`;
}

export function buildWhatsAppMessage(order = {}) {
  return [
    "New Order - Ramji Bakery 🍰",
    "",
    `Customer Name: ${order.customer || order.name || "Customer"}`,
    `Customer Phone: ${order.phone || ""}`,
    `Customer Email: ${order.customerEmail || OWNER_EMAIL}`,
    buildItemsLine(order.items),
    `Total: ₹${order.total ?? 0}`,
    order.address ? `Address: ${order.address}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildWhatsAppUrl(order) {
  const message = buildWhatsAppMessage(order);
  return `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;
}

export function sendWhatsApp(order) {
  if (!order || !order.items || !order.items.length) {
    alert("Order details missing. Please try again.");
    return "";
  }

  const url = buildWhatsAppUrl(order);
  console.log("WhatsApp URL:", url);

  if (typeof window !== "undefined") {
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) {
      window.setTimeout(() => {
        window.location.href = url;
      }, 1000);
    }
  }

  return url;
}

