import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  deleteConversation,
  deleteMessage,
  getConversations,
  getMessages,
  getUnreadMessageCount,
  sendMessage,
  updateMessage,
} from "../conrollers/messageController.js";

const router = express.Router();

router.use(protect);
router.get("/unread-count", getUnreadMessageCount);
router.get("/", getConversations);
router.delete("/conversation/:userId", deleteConversation);
router.patch("/item/:messageId", updateMessage);
router.delete("/item/:messageId", deleteMessage);
router.get("/:userId", getMessages);
router.post("/:userId", sendMessage);

export default router;
