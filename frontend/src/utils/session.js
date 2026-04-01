import { disconnectSocket, emitLogout } from "../services/socket";

export const logoutUser = (navigate) => {
  emitLogout();
  disconnectSocket();
  localStorage.removeItem("token");

  if (typeof navigate === "function") {
    navigate("/login");
  }
};
