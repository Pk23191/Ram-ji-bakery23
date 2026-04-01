export const DELIVERY_CHARGE = 0;

export const calculatePricingSummary = (subtotal = 0, discountPercent = 0) => {
  const normalizedSubtotal = Number(subtotal || 0);
  const safeDiscount = Math.min(Math.max(Number(discountPercent || 0), 0), 90);
  const discountAmount = Number(((normalizedSubtotal * safeDiscount) / 100).toFixed(2));
  const total = Number((normalizedSubtotal - discountAmount).toFixed(2));

  return {
    subtotal: normalizedSubtotal,
    deliveryCharge: 0,
    discountPercent: safeDiscount,
    discountAmount,
    total: total < 0 ? 0 : total
  };
};
