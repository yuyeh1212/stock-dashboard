import axios from "axios";

const api = axios.create({
  baseURL: "https://stock-backend.zeabur.app",
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("bind_token");
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default api;
