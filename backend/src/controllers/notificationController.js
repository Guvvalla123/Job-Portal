const notificationService = require("../services/notificationService");
const { asyncHandler } = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

const listMyNotifications = asyncHandler(async (req, res) => {
  const { page = "1", limit = "20" } = req.query;
  const data = await notificationService.getNotifications(req.user.userId, page, limit);
  return success(res, data, "Notifications loaded");
});

const getUnreadCount = asyncHandler(async (req, res) => {
  const data = await notificationService.getUnreadCount(req.user.userId);
  return success(res, data, "Unread count loaded");
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await notificationService.markAsRead(id, req.user.userId);
  return success(res, { notification }, "Marked as read");
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.userId);
  return success(res, {}, "All marked as read");
});

const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id, req.user.userId);
  return success(res, {}, "Notification deleted");
});

module.exports = {
  listMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
