import { io } from "socket.io-client";

let socket;

const getSocketUrl = () => {
  const apiUrl = process.env.REACT_APP_API_URL;

  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, "");
  }

  const hostname = window.location.hostname;
  const socketHost =
    hostname === "localhost" || hostname === "127.0.0.1" ? "localhost" : hostname;

  return `http://${socketHost}:5000`;
};

export const connectSocket = () => {
  const token = localStorage.getItem("token");

  if (!token) return null;

  if (socket?.connected) return socket;

  if (!socket) {
    socket = io(getSocketUrl(), {
      autoConnect: false,
      auth: { token },
    });
  } else {
    socket.auth = { token };
  }

  socket.connect();
  return socket;
};

export const getSocket = () => socket;

export const emitLogout = () => {
  if (!socket) return;
  socket.emit("presence:logout");
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};
