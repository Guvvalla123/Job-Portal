const { Notification } = require("../models/Notification");
const { asyncHandler } = require("../utils/asyncHandler");

async function createNotification({ userId, type, title, message, link, meta }) {
  await Notification.create({ user: userId, type, title, message, link, meta });
}

const listMyNotifications = asyncHandler(async (req, res) => {
  const { limit = "20" } = req.query;
  const notifications = await Notification.find({ user: req.user.userId })
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit), 50));

  const unreadCount = await Notification.countDocuments({ user: req.user.userId, read: false });

  return res.status(200).json({
    success: true,
    data: { notifications, unreadCount },
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Notification.findOneAndUpdate(
    { _id: id, user: req.user.userId },
    { read: true }
  );
  return res.status(200).json({ success: true, message: "Marked as read" });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.userId }, { read: true });
  return res.status(200).json({ success: true, message: "All marked as read" });
});

module.exports = {
  createNotification,
  listMyNotifications,
  markAsRead,
  markAllAsRead,
};
