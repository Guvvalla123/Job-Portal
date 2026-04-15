const { Notification } = require("../models/Notification");

const create = (data) => Notification.create(data);

const findOneAndMarkRead = (notificationId, userId) =>
  Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { read: true, readAt: new Date() } },
    { new: true },
  );

const updateManyMarkAllRead = (userId) => {
  const now = new Date();
  return Notification.updateMany({ user: userId, read: false }, { $set: { read: true, readAt: now } });
};

const findByUserPaginated = async (userId, page, limit) => {
  const skip = (page - 1) * limit;
  const filter = { user: userId };
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, read: false }),
  ]);
  return { notifications, total, unreadCount };
};

const countUnreadByUser = (userId) => Notification.countDocuments({ user: userId, read: false });

const findOneAndDeleteForUser = (notificationId, userId) =>
  Notification.findOneAndDelete({ _id: notificationId, user: userId });

const deleteManyOlderThan = (cutoffDate) => Notification.deleteMany({ createdAt: { $lt: cutoffDate } });

const findByUserLean = (userId) => Notification.find({ user: userId }).lean();

module.exports = {
  create,
  findOneAndMarkRead,
  updateManyMarkAllRead,
  findByUserPaginated,
  countUnreadByUser,
  findOneAndDeleteForUser,
  deleteManyOlderThan,
  findByUserLean,
};
