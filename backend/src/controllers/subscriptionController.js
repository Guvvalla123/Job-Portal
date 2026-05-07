const { asyncHandler } = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const subscriptionService = require("../services/subscriptionService");

const createOrder = asyncHandler(async (req, res) => {
  const result = await subscriptionService.createOrder(req.user.userId);
  return success(res, result, "Order created. Complete payment in Razorpay.");
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};
  const paymentData = {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  };
  await subscriptionService.verifyPayment(req.user.userId, paymentData);
  const status = await subscriptionService.getSubscriptionStatus(req.user.userId);
  return success(res, status, "Premium activated successfully.");
});

const getStatus = asyncHandler(async (req, res) => {
  const result = await subscriptionService.getSubscriptionStatus(req.user.userId);
  return success(res, result);
});

const cancelSubscription = asyncHandler(async (req, res) => {
  const reason = req.body?.reason;
  const result = await subscriptionService.cancelSubscription(req.user.userId, reason);
  return success(
    res,
    result,
    "Subscription cancelled. Your premium benefits continue until the end of the current period."
  );
});

module.exports = {
  createOrder,
  verifyPayment,
  getStatus,
  cancelSubscription,
};
