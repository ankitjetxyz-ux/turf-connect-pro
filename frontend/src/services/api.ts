import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  let token = localStorage.getItem("token");

  // If it's an admin route, try to use the admin token
  if (config.url?.startsWith("/admin") || config.url?.startsWith("admin")) {
    const adminToken = localStorage.getItem("adminToken");
    if (adminToken) token = adminToken;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 unauthorized - redirect to login
    if (error.response?.status === 401) {
      const isAdminDetails = error.config?.url?.includes("/admin");

      if (isAdminDetails) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        window.location.href = "/admin/login";
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user_id");
        localStorage.removeItem("name");
        localStorage.removeItem("email");
        localStorage.removeItem("profile_image_url");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
