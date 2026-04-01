function buildWhatsAppUrl(phone, message) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  const text = encodeURIComponent(message || "");
  return `https://wa.me/${digits}?text=${text}`;
}

module.exports = {
  buildWhatsAppUrl
};
