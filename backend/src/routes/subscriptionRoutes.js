const express = require("express");
const {
  createOrder,
  verifyPayment,
  getStatus,
  cancelSubscription,
} = require("../controllers/subscriptionController");
const { requireAuth } = require("../middlewares/auth");
const { csrfProtection } = require("../middlewares/csrf");
const { validate } = require("../middlewares/validate");
const { subscriptionVerifySchema } = require("../validations/jobValidation");

const router = express.Router();

router.post("/create-order", requireAuth, createOrder);
router.post(
  "/verify-payment",
  requireAuth,
  csrfProtection,
  validate(subscriptionVerifySchema),
  verifyPayment
);
router.get("/status", requireAuth, getStatus);
router.delete("/cancel", requireAuth, csrfProtection, cancelSubscription);

module.exports = { subscriptionRoutes: router };
