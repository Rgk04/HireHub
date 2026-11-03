import express from "express";
import {
  deleteNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/getall", isAuthenticated, getMyNotifications);
router.put("/readall", isAuthenticated, markAllNotificationsRead);
router.put("/read/:id", isAuthenticated, markNotificationRead);
router.delete("/:id", isAuthenticated, deleteNotification);

export default router;
