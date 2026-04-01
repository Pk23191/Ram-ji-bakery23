export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);

export const ORDER_STATUSES = ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"];

export const getOrderStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-700";
    case "Confirmed":
      return "bg-sky-100 text-sky-700";
    case "Preparing":
      return "bg-indigo-100 text-indigo-700";
    case "Out for Delivery":
      return "bg-fuchsia-100 text-fuchsia-700";
    case "Delivered":
      return "bg-emerald-100 text-emerald-700";
    case "Cancelled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-stone-100 text-stone-700";
  }
};

export const getUnitPrice = (item) => {
  if (item?.finalPrice != null) return Number(item.finalPrice);
  if (item?.discountedPrice != null) return Number(item.discountedPrice);
  return Number(item?.price || 0);
};

export const calculateCartTotal = (items) =>
  items.reduce((sum, item) => sum + getUnitPrice(item) * Number(item.quantity || 0), 0);

export const createSlug = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

export const canCancelOrder = (status) => !["Out for Delivery", "Delivered", "Cancelled"].includes(status);
export const canAdminManageOrder = (status) => status !== "Cancelled";

export const getOrderTrackingMessage = (status) => {
  switch (status) {
    case "Pending":
      return "Your order is placed and waiting for bakery confirmation.";
    case "Confirmed":
      return "The bakery has accepted your order and started preparing it.";
    case "Preparing":
      return "Your order is being freshly prepared in the bakery.";
    case "Out for Delivery":
      return "Your order is packed and out for delivery.";
    case "Delivered":
      return "Your order has been delivered. Enjoy the treats.";
    case "Cancelled":
      return "This order was cancelled. Please review the cancellation reason below.";
    default:
      return "We are checking the latest update for this order.";
  }
};

export const getTrackableStatuses = (status) =>
  status === "Cancelled"
    ? ["Pending", "Cancelled"]
    : ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered"];

export const getStatusStepState = (currentStatus, stepStatus) => {
  const steps = getTrackableStatuses(currentStatus);
  const currentIndex = steps.indexOf(currentStatus);
  const stepIndex = steps.indexOf(stepStatus);

  if (stepIndex === -1) {
    return "upcoming";
  }

  if (stepIndex < currentIndex) {
    return "complete";
  }

  if (stepIndex === currentIndex) {
    return "current";
  }

  return "upcoming";
};

export const getNextOrderStatus = (status) => {
  switch (status) {
    case "Pending":
      return "Confirmed";
    case "Confirmed":
      return "Preparing";
    case "Preparing":
      return "Out for Delivery";
    case "Out for Delivery":
      return "Delivered";
    default:
      return "";
  }
};
