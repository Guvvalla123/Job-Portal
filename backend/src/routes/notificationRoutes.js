const express = require("express");
const {
  listMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.get("/", requireAuth, listMyNotifications);
router.get("/unread-count", requireAuth, getUnreadCount);
router.patch("/read-all", requireAuth, markAllAsRead);
router.patch("/:id/read", requireAuth, markAsRead);
router.delete("/:id", requireAuth, deleteNotification);

module.exports = { notificationRoutes: router };
