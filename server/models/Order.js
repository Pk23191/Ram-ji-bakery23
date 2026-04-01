const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },
    customer: { type: String, required: true },
    customerEmail: { type: String, default: "", trim: true, lowercase: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    paymentMethod: { type: String, enum: ["COD", "UPI"], required: true },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Pending"
    },
    items: [
      {
        productId: String,
        name: String,
        image: String,
        category: String,
        quantity: Number,
        price: Number,
        customizations: Object
      }
    ],
    subtotal: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    gstEnabled: { type: Boolean, default: false },
    gstRate: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    behaviorTags: [String],
    orderTime: { type: Date, default: Date.now },
    cancelReason: { type: String, default: "" },
    cancelledAt: { type: Date, default: null },
    cancelledBy: { type: String, enum: ["customer", "admin", ""], default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
