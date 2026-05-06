import axios from "axios";

const hostname = window.location.hostname; 
  hostname === "localhost" || hostname === "127.0.0.1"
    ? "localhost"
    : hostname;

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://localhost:5001/api`,
  timeout: 10000,
});

// Add JWT token automatically if exists
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.userMessage =
        "Server response timeout. Check backend and MongoDB connection.";
    } else if (!error.response) {
      error.userMessage =
        "Cannot reach backend. Make sure server is running on port 5001.";
    }
    return Promise.reject(error);
  }
);

export default API;
