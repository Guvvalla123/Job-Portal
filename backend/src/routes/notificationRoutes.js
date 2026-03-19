const express = require("express");
const { listMyNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.get("/", requireAuth, listMyNotifications);
router.patch("/read-all", requireAuth, markAllAsRead);
router.patch("/:id/read", requireAuth, markAsRead);

module.exports = { notificationRoutes: router };
