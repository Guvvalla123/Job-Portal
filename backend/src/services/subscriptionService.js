const crypto = require("crypto");
const Razorpay = require("razorpay");
const { ApiError } = require("../utils/apiError");
const { env } = require("../config/env");
const { Subscription } = require("../models/Subscription");
const { User } = require("../models/User");
const userRepository = require("../repositories/userRepository");

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function requireRazorpayKeys() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(503, "Payment provider is not configured");
  }
}

function getRazorpayClient() {
  requireRazorpayKeys();
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  if (expected.length !== signature.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

function hasPaidActivePremium(subscription, now = new Date()) {
  if (!subscription) return false;
  return (
    subscription.status === "active" &&
    subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd > now
  );
}

/**
 * @param {string} userId
 * @returns {Promise<{ order: object, keyId: string }>}
 */
const createOrder = async (userId) => {
  requireRazorpayKeys();

  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const now = new Date();
  if (user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt > now) {
    throw new ApiError(400, "You already have an active premium subscription");
  }

  const existing = await Subscription.findOne({ user: userId });
  if (hasPaidActivePremium(existing, now)) {
    throw new ApiError(400, "You already have an active premium subscription");
  }

  const amountPaise = env.SUBSCRIPTION_PRICE_PAISE;
  const receipt = `s_${String(userId).slice(-10)}_${Date.now().toString(36)}`.slice(0, 40);

  const razorpay = getRazorpayClient();
  let order;
  try {
    order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      payment_capture: 1,
    });
  } catch (err) {
    const msg = err?.error?.description || err?.message || "Failed to create payment order";
    throw new ApiError(502, msg);
  }

  let subscription =
    existing ||
    (await Subscription.create({
      user: userId,
    }));

  subscription.razorpayOrderId = order.id;
  subscription.priceINR = amountPaise / 100;
  await subscription.save();

  return {
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    },
    keyId: env.RAZORPAY_KEY_ID,
  };
};

/**
 * @param {string} userId
 * @param {{ razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }} paymentData
 */
const verifyPayment = async (userId, paymentData) => {
  requireRazorpayKeys();

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
    paymentData || {};

  if (!orderId || !paymentId || !signature) {
    throw new ApiError(400, "Missing payment verification fields");
  }

  const valid = verifyRazorpaySignature(orderId, paymentId, signature, env.RAZORPAY_KEY_SECRET);
  if (!valid) {
    throw new ApiError(400, "Invalid payment signature");
  }

  return activatePremium(userId, paymentData);
};

/**
 * @param {string} userId
 * @param {{ razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }} paymentData
 */
const activatePremium = async (userId, paymentData) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
    paymentData || {};

  if (!orderId || !paymentId || !signature) {
    throw new ApiError(400, "Missing payment data");
  }

  const subscription = await Subscription.findOne({ user: userId });
  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }
  if (subscription.razorpayOrderId && subscription.razorpayOrderId !== orderId) {
    throw new ApiError(400, "Payment does not match the latest order for this account");
  }

  const periodStart = new Date();
  const periodEnd = new Date(Date.now() + 30 * MS_PER_DAY);

  subscription.status = "active";
  subscription.plan = "premium";
  subscription.currentPeriodStart = periodStart;
  subscription.currentPeriodEnd = periodEnd;
  subscription.razorpayOrderId = orderId;
  subscription.razorpayPaymentId = paymentId;
  subscription.razorpaySignature = signature;
  subscription.paymentHistory.push({
    razorpayPaymentId: paymentId,
    amount: env.SUBSCRIPTION_PRICE_PAISE,
    currency: "INR",
    paidAt: new Date(),
    status: "success",
  });

  await subscription.save();
  await userRepository.updateById(userId, {
    isPremium: true,
    premiumExpiresAt: periodEnd,
  });

  return { subscription: subscription.toJSON({ virtuals: true }) };
};

/**
 * @param {string} userId
 */
const getSubscriptionStatus = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const now = new Date();
  const sub = await Subscription.findOne({ user: userId });

  if (!sub) {
    const isPremium = Boolean(user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt > now);
    const daysRemaining =
      isPremium && user.premiumExpiresAt
        ? Math.ceil((user.premiumExpiresAt - now) / MS_PER_DAY)
        : 0;
    return {
      plan: "free",
      status: null,
      isPremium,
      daysRemaining,
      subscription: null,
    };
  }

  const subJson = sub.toJSON({ virtuals: true });
  let isPremium = Boolean(subJson.isPremium);
  let daysRemaining = typeof subJson.daysRemaining === "number" ? subJson.daysRemaining : 0;

  if (user.isPremium && user.premiumExpiresAt && user.premiumExpiresAt > now) {
    isPremium = true;
    const fromUser = Math.ceil((user.premiumExpiresAt - now) / MS_PER_DAY);
    daysRemaining = Math.max(daysRemaining, fromUser);
  }

  return {
    plan: subJson.plan,
    status: subJson.status,
    isPremium,
    daysRemaining,
    subscription: subJson,
  };
};

/**
 * @param {string} userId
 * @param {string} [reason]
 */
const cancelSubscription = async (userId, reason = "") => {
  const subscription = await Subscription.findOne({ user: userId });
  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  const now = new Date();
  if (
    subscription.status !== "active" ||
    !subscription.currentPeriodEnd ||
    subscription.currentPeriodEnd <= now
  ) {
    throw new ApiError(400, "No active subscription to cancel");
  }

  subscription.status = "cancelled";
  subscription.cancelledAt = new Date();
  subscription.cancellationReason = reason ? String(reason).slice(0, 500) : null;
  await subscription.save();

  return { subscription: subscription.toJSON({ virtuals: true }) };
};

const checkAndExpireSubscriptions = async () => {
  const now = new Date();
  const subs = await Subscription.find({
    status: { $in: ["active", "cancelled"] },
    currentPeriodEnd: { $lte: now },
  }).select("user");

  let count = 0;
  for (const sub of subs) {
    await Subscription.findByIdAndUpdate(sub._id, { $set: { status: "expired" } });
    await userRepository.updateById(sub.user, {
      isPremium: false,
      premiumExpiresAt: null,
    });
    count += 1;
  }

  return { expiredCount: count };
};

const resetMonthlyUsage = async () => {
  const d = new Date();
  const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);

  const result = await User.updateMany(
    {},
    {
      $set: {
        atsChecksUsedThisMonth: 0,
        resumeReviewsUsedThisMonth: 0,
        atsChecksResetAt: startOfMonth,
        resumeReviewsResetAt: startOfMonth,
      },
    }
  );

  return { updatedCount: result.modifiedCount };
};

module.exports = {
  createOrder,
  verifyPayment,
  activatePremium,
  getSubscriptionStatus,
  cancelSubscription,
  checkAndExpireSubscriptions,
  resetMonthlyUsage,
};
