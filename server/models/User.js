const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: "" },
    emailVerificationExpires: { type: Date, default: null },
    passwordResetToken: { type: String, default: "" },
    passwordResetExpires: { type: Date, default: null },
    googleId: { type: String, default: "" },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer"
    }
  },
  { timestamps: true }
);

userSchema.virtual("isVerified").get(function getIsVerified() {
  return Boolean(this.emailVerified);
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("User", userSchema);
