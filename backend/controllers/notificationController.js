import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import { Notification } from "../models/notificationSchema.js";
import { assertObjectId, parsePagination } from "../utils/validate.js";

export const getMyNotifications = catchAsyncErrors(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 10);
  const match = { user: req.user._id };

  const [notifications, total, unread] = await Promise.all([
    Notification.find(match)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(match),
    Notification.countDocuments({ ...match, read: false }),
  ]);

  res.status(200).json({
    success: true,
    notifications,
    unread,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    currentPage: page,
  });
});

export const markNotificationRead = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "notification");

  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notification) {
    return next(new ErrorHandler("Notification not found.", 404));
  }

  notification.read = true;
  await notification.save();

  const unread = await Notification.countDocuments({
    user: req.user._id,
    read: false,
  });

  res.status(200).json({ success: true, unread, notification });
});

export const markAllNotificationsRead = catchAsyncErrors(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, read: false },
    { $set: { read: true } }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read.",
    unread: 0,
  });
});

export const deleteNotification = catchAsyncErrors(async (req, res, next) => {
  assertObjectId(req.params.id, "notification");

  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!notification) {
    return next(new ErrorHandler("Notification not found.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Notification removed.",
  });
});
