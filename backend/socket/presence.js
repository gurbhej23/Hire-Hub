import User from "../models/User.js";
import Message from "../models/Message.js";

export const registerPresenceHandlers = (io, onlineUsers, emitStatusToUser) => {
  const emitToUser = (userId, event, payload) => {
    (onlineUsers.get(userId) || []).forEach((socketId) =>
      io.to(socketId).emit(event, payload)
    );
  };

  const broadcastPresence = (userId, payload) => {
    onlineUsers.forEach((_, targetUserId) => {
      if (targetUserId !== userId) emitToUser(targetUserId, "presence:update", payload);
    });
  };

  return async (socket) => {
    const userId = socket.userId;
    if (!userId) return;

    const currentSockets = onlineUsers.get(userId) || [];
    onlineUsers.set(userId, [...currentSockets, socket.id]);

    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    const undeliveredMessages = await Message.find({
      recipient: userId,
      delivered: false,
    })
      .populate("sender", "name email profileImage lastSeen")
      .populate("recipient", "name email profileImage lastSeen");

    if (undeliveredMessages.length) {
      await Message.updateMany(
        { recipient: userId, delivered: false },
        { $set: { delivered: true } }
      );

      undeliveredMessages.forEach((message) => {
        message.delivered = true;
        emitStatusToUser(message.sender._id.toString(), "message:new", message);
        emitStatusToUser(userId, "message:new", message);
      });
    }

    broadcastPresence(userId, { userId, isOnline: true, lastSeen: new Date().toISOString() });

    socket.on("presence:logout", async () => {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      onlineUsers.delete(userId);
      broadcastPresence(userId, { userId, isOnline: false, lastSeen: new Date().toISOString() });
    });

    socket.on("disconnect", async () => {
      const remainingSockets = (onlineUsers.get(userId) || []).filter(id => id !== socket.id);
      if (remainingSockets.length) {
        onlineUsers.set(userId, remainingSockets);
        return;
      }

      onlineUsers.delete(userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { lastSeen });
      broadcastPresence(userId, { userId, isOnline: false, lastSeen: lastSeen.toISOString() });
    });
  };
};
