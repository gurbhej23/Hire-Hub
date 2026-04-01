import axios from "axios";

const hostname = window.location.hostname;
const apiHost =
  hostname === "localhost" || hostname === "127.0.0.1"
    ? "localhost"
    : hostname;

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || `http://${apiHost}:5000/api`,
});

// Add JWT token automatically if exists
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
