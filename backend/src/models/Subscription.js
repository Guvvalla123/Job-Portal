const mongoose = require("mongoose");

const paymentHistoryEntrySchema = new mongoose.Schema(
  {
    razorpayPaymentId: { type: String },
    amount: { type: Number },
    currency: { type: String, default: "INR" },
    paidAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["success", "failed", "refunded"],
      default: "success",
    },
  },
  { _id: true }
);

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "expired", "cancelled", "trial"],
      default: "trial",
    },
    plan: {
      type: String,
      required: true,
      enum: ["free", "premium"],
      default: "free",
    },
    priceINR: { type: Number, default: 25 },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, select: false, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    trialStartedAt: { type: Date, default: Date.now },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null, maxlength: 500 },
    paymentHistory: { type: [paymentHistoryEntrySchema], default: [] },
  },
  { timestamps: true }
);

subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

subscriptionSchema.virtual("isPremium").get(function getIsPremium() {
  const now = new Date();
  if (
    this.status === "active" &&
    this.currentPeriodEnd &&
    this.currentPeriodEnd > now
  ) {
    return true;
  }
  if (this.status === "trial" && this.trialEndsAt && this.trialEndsAt > now) {
    return true;
  }
  return false;
});

subscriptionSchema.virtual("daysRemaining").get(function getDaysRemaining() {
  if (!this.isPremium) return 0;
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  if (this.status === "active" && this.currentPeriodEnd) {
    return Math.ceil((this.currentPeriodEnd - now) / msPerDay);
  }
  if (this.status === "trial" && this.trialEndsAt) {
    return Math.ceil((this.trialEndsAt - now) / msPerDay);
  }
  return 0;
});

subscriptionSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.razorpaySignature;
    return ret;
  },
});

module.exports = { Subscription: mongoose.model("Subscription", subscriptionSchema) };
