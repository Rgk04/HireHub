import { Notification } from "../models/notificationSchema.js";

export const createNotification = async ({
  user,
  title,
  message,
  type = "system",
  application,
  job,
}) => {
  try {
    if (!user || !title || !message) return null;
    return await Notification.create({
      user,
      title,
      message,
      type,
      application,
      job,
    });
  } catch (error) {
    // Notifications must never break the main workflow.
    console.error("Failed to create notification:", error.message);
    return null;
  }
};
