import axios from "axios";

const api = axios.create({
  baseURL: "https://stock-backend.zeabur.app",
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("access_token") || localStorage.getItem("bind_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("⚠️ No token found in localStorage");
  }
  console.log(`📤 API Request: ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.statusText}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // 服務器返回了錯誤響應
      console.error(
        `❌ API Error: ${error.response.status} ${error.response.statusText}`,
        error.response.data
      );
      return Promise.reject(
        new Error(
          `API Error: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`
        )
      );
    } else if (error.request) {
      // 請求已發送但沒有收到響應
      console.error("❌ Network Error: No response from server", error.request);
      return Promise.reject(new Error("Network Error: No response from server"));
    } else {
      // 其他錯誤
      console.error("❌ Error:", error.message);
      return Promise.reject(error);
    }
  }
);

export default api;
