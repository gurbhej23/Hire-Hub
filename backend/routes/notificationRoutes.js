import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../conrollers/notificationController.js";

const router = express.Router();

router.use(protect);
router.get("/", getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.delete("/:id", deleteNotification);
router.delete("/", deleteAllNotifications);

export default router;
