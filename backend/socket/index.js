import { Server } from "socket.io";
import { parseSocketUserId } from "../utils/parseSocketUserId.js";
import { registerPresenceHandlers } from "./presence.js";
import { registerMessageSocketHandlers } from "../conrollers/messageController.js";

export const initSockets = (server) => {
  const io = new Server(server, { cors: { origin: true } });
  const onlineUsers = new Map();
  const emitToUser = (userId, event, payload) => {
    (onlineUsers.get(userId) || []).forEach((sid) => io.to(sid).emit(event, payload));
  };
  const isUserOnline = (userId) => (onlineUsers.get(userId) || []).length > 0;

  io.use((socket, next) => {
    const userId = parseSocketUserId(socket);
    if (!userId) return next(new Error("Authentication error"));
    socket.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    registerPresenceHandlers(io, onlineUsers, emitToUser)(socket);
    registerMessageSocketHandlers({
      emitMessageEvent: (userId, message) => emitToUser(userId, "message:new", message),
      emitTypingEvent: (userId, payload) => emitToUser(userId, "message:typing", payload),
      isUserOnline,
    })(socket);
  });

  return io;
};
