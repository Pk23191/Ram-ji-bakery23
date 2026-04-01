import axios from "axios";

const rawBaseUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.VITE_API_URL ||
  "https://ram-ji-bakery23.onrender.com/api";
const baseURL = rawBaseUrl.replace(/\/+$/, "");

const api = axios.create({
  baseURL
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error?.response?.status, error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const setAdminAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
