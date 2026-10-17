
import axios from "axios";

const portalClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
portalClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle authentication errors
portalClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

export default portalClient;
