const DELIVERY_CHARGE = 60;

function calculateOrderTotals(items = []) {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const deliveryCharge = items.length ? DELIVERY_CHARGE : 0;
  const total = Number((subtotal + deliveryCharge).toFixed(2));

  return {
    subtotal,
    deliveryCharge,
    total
  };
}

module.exports = {
  DELIVERY_CHARGE,
  calculateOrderTotals
};
