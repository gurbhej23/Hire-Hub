import axios from "axios";

const hostname = window.location.hostname; 
  hostname === "localhost" || hostname === "127.0.0.1"
    ? "localhost"
    : hostname;

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://localhost:5001/api`,
});

// Add JWT token automatically if exists
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
