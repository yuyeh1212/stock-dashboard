import axios from "axios";

const api = axios.create({
  baseURL: "https://stock-backend.zeabur.app",
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("bind_token");
  console.log("🔑 request token:", token?.slice(0, 20), config.url);
  if (token) config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("bind_token");
      if (!token) return Promise.reject(error); // 本來就沒 token，不做任何事
      localStorage.removeItem("access_token");
      localStorage.removeItem("bind_token");
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

export default api;
