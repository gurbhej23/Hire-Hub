import mongoose from "mongoose";
import Message from "../models/Message.js";
import User from "../models/User.js";

let emitMessageEvent = null;
let emitTypingEvent = null;
let isSocketUserOnline = null;

const populateMessageById = async (messageId) =>
  Message.findById(messageId)
    .populate("sender", "name email profileImage lastSeen")
    .populate("recipient", "name email profileImage lastSeen");

export const registerMessageSocketHandlers = ({
  emitMessageEvent: nextEmitMessageEvent,
  emitTypingEvent: nextEmitTypingEvent,
  isUserOnline,
}) => {
  emitMessageEvent = nextEmitMessageEvent;
  emitTypingEvent = nextEmitTypingEvent;
  isSocketUserOnline = isUserOnline;

  return (socket) => {
    const userId = socket.userId;
    if (!userId) return;

    // Typing indicator
    socket.on("message:typing", ({ recipientId, isTyping }) => {
      emitTypingEvent(recipientId, { senderId: userId, isTyping });
    });

    // Sending a new message
    socket.on("message:new", async ({ recipientId, content }) => {
      try {
        const message = await Message.create({
          sender: userId,
          recipient: recipientId,
          text: content,
          delivered: Boolean(isSocketUserOnline?.(recipientId)),
        });

        const populatedMessage = await populateMessageById(message._id);

        // Emit to recipient and sender
        emitMessageEvent(recipientId, populatedMessage);
        emitMessageEvent(userId, populatedMessage);
      } catch (error) {
        console.error("Message send error:", error);
      }
    });

    // Optionally: mark message as read
    socket.on("message:read", async ({ messageId }) => {
      try {
        const message = await Message.findByIdAndUpdate(
          messageId,
          { read: true, delivered: true },
          { new: true }
        );

        if (message) {
          const populatedMessage = await populateMessageById(message._id);
          emitMessageEvent(message.sender.toString(), populatedMessage);
          emitMessageEvent(message.recipient.toString(), populatedMessage);
        }
      } catch (error) {
        console.error("Message read error:", error);
      }
    });
  };
};

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: currentUserId }, { recipient: currentUserId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", currentUserId] }, "$recipient", "$sender"],
          },
          lastMessage: { $first: "$text" },
          updatedAt: { $first: "$createdAt" },
          hasUnread: {
            $first: {
              $and: [
                { $eq: ["$recipient", currentUserId] },
                { $eq: ["$read", false] },
              ],
            },
          },
        },
      },
      { $sort: { updatedAt: -1 } },
    ]);

    const userIds = conversations.map((conversation) => conversation._id);
    const users = await User.find({ _id: { $in: userIds } }).select(
      "name email profileImage role location lastSeen"
    );

    const userMap = new Map(users.map((user) => [user._id.toString(), user]));
    const result = conversations
      .map((conversation) => ({
        user: userMap.get(conversation._id.toString()) || null,
        lastMessage: conversation.lastMessage,
        updatedAt: conversation.updatedAt,
        hasUnread: conversation.hasUnread,
      }))
      .filter((conversation) => conversation.user);

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch conversations" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const [user, messages] = await Promise.all([
      User.findById(targetUserId).select("name email profileImage role location lastSeen"),
      Message.find({ sender: targetUserId, recipient: req.user._id, read: false }).select("_id"),
    ]);

    if (messages.length) {
      await Message.updateMany(
        { _id: { $in: messages.map((message) => message._id) } },
        { $set: { read: true, delivered: true } }
      );

      if (emitMessageEvent) {
        const updatedMessages = await Message.find({
          _id: { $in: messages.map((message) => message._id) },
        })
          .populate("sender", "name email profileImage lastSeen")
          .populate("recipient", "name email profileImage lastSeen");

        updatedMessages.forEach((message) => {
          emitMessageEvent(targetUserId, message);
          emitMessageEvent(req.user._id.toString(), message);
        });
      }
    }

    const conversationMessages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: targetUserId },
        { sender: targetUserId, recipient: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name email profileImage lastSeen")
      .populate("recipient", "name email profileImage lastSeen");

    return res.json({
      user,
      messages: conversationMessages,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const recipientId = req.params.userId;
    const text = req.body.text?.trim();

    if (!mongoose.Types.ObjectId.isValid(recipientId)) {
      return res.status(400).json({ message: "Invalid recipient id" });
    }

    if (!text) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const message = await Message.create({
      sender: req.user._id,
      recipient: recipientId,
      text,
      delivered: Boolean(isSocketUserOnline?.(recipientId)),
    });

    const populatedMessage = await populateMessageById(message._id);

    if (emitMessageEvent) {
      emitMessageEvent(recipientId, populatedMessage);
      emitMessageEvent(req.user._id.toString(), populatedMessage);
    }

    return res.status(201).json(populatedMessage);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to send message" });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const text = req.body.text?.trim();

    if (!text) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can edit only your own message" });
    }

    message.text = text;
    message.edited = true;
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name email profileImage lastSeen")
      .populate("recipient", "name email profileImage lastSeen");

    return res.json(populatedMessage);
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to update message" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can delete only your own message" });
    }

    await message.deleteOne();
    return res.json({ message: "Message deleted", messageId });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to delete message" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const targetUserId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const result = await Message.deleteMany({
      $or: [
        { sender: req.user._id, recipient: targetUserId },
        { sender: targetUserId, recipient: req.user._id },
      ],
    });

    return res.json({
      message: "Conversation deleted",
      deletedCount: result.deletedCount || 0,
      userId: targetUserId,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to delete conversation" });
  }
};

export const getUnreadMessageCount = async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      recipient: req.user._id,
      read: false,
    });

    return res.json({ unreadCount });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch unread count" });
  }
};

export const handleSocketTyping = ({ recipientId, senderId, isTyping }) => {
  if (emitTypingEvent && recipientId && senderId) {
    emitTypingEvent(recipientId, { userId: senderId, isTyping });
  }
};
 
