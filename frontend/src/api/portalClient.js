import axios from "axios";

const portalClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

portalClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("portalToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

portalClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("portalToken");
      localStorage.removeItem("portalUser");
    }

    return Promise.reject(error);
  }
);

export default portalClient;
