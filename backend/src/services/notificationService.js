const notificationRepository = require("../repositories/notificationRepository");
const { ApiError } = require("../utils/apiError");

/**
 * @param {object} params
 * @param {import("mongoose").Types.ObjectId | string} params.userId
 * @param {string} params.type
 * @param {string} params.title
 * @param {string} [params.message]
 * @param {string} [params.link]
 * @param {object} [params.meta]
 */
async function createNotification({ userId, type, title, message, link, meta }) {
  const doc = await notificationRepository.create({
    user: userId,
    type,
    title,
    message: message ?? "",
    link: link ?? "",
    meta,
  });
  return doc;
}

/**
 * @param {string} notificationId
 * @param {import("mongoose").Types.ObjectId | string} userId
 */
async function markAsRead(notificationId, userId) {
  const updated = await notificationRepository.findOneAndMarkRead(notificationId, userId);
  if (!updated) throw new ApiError(404, "Notification not found");
  return updated;
}

/**
 * @param {import("mongoose").Types.ObjectId | string} userId
 */
async function markAllAsRead(userId) {
  await notificationRepository.updateManyMarkAllRead(userId);
}

/**
 * @param {import("mongoose").Types.ObjectId | string} userId
 * @param {number} [page]
 * @param {number} [limit]
 */
async function getNotifications(userId, page = 1, limit = 20) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(50, Math.max(1, Number(limit) || 20));

  const { notifications, total, unreadCount } = await notificationRepository.findByUserPaginated(userId, p, l);

  const totalPages = total === 0 ? 0 : Math.ceil(total / l);

  return {
    notifications,
    total,
    page: p,
    limit: l,
    totalPages,
    unreadCount,
  };
}

/**
 * @param {import("mongoose").Types.ObjectId | string} userId
 */
async function getUnreadCount(userId) {
  const count = await notificationRepository.countUnreadByUser(userId);
  return { count };
}

/**
 * @param {string} notificationId
 * @param {import("mongoose").Types.ObjectId | string} userId
 */
async function deleteNotification(notificationId, userId) {
  const deleted = await notificationRepository.findOneAndDeleteForUser(notificationId, userId);
  if (!deleted) throw new ApiError(404, "Notification not found");
  return deleted;
}

/** Deletes notifications older than 30 days (e.g. cron). */
async function deleteOldNotifications() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const result = await notificationRepository.deleteManyOlderThan(cutoff);
  return { deletedCount: result.deletedCount };
}

module.exports = {
  createNotification,
  markAsRead,
  markAllAsRead,
  getNotifications,
  getUnreadCount,
  deleteNotification,
  deleteOldNotifications,
};
