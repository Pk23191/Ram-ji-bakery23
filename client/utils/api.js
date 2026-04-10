import axios from "axios";

// Determine API base URL based on environment
const getBaseURL = () => {
  // Prefer explicit environment variable when provided (works for Vercel -> Render setup)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  // Fallback for local development
  if (typeof window !== "undefined") {
    return "http://localhost:5000/api";
  }

  // Fallback for SSR — should not reach here in production if env var is set
  return "http://localhost:5000/api";
};

const baseURL = getBaseURL().replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  timeout: 30000
});

// Helper used by admin UI to set global auth header for admin requests.
export const setAdminAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// Attach customer token from localStorage to every request if not already set.
api.interceptors.request.use(
  (config) => {
    try {
      if (!config.headers) config.headers = {};
      if (!config.headers.Authorization) {
        const raw = window.localStorage.getItem("ramji-customer-session");
        const session = raw ? JSON.parse(raw) : null;
        if (session?.token) {
          config.headers.Authorization = `Bearer ${session.token}`;
        }
      }
    } catch (e) {
      // ignore
    }

    return config;
  },
  (err) => Promise.reject(err)
);

// Handle responses and auto-logout on 401 so frontend and stored tokens stay in sync.
let isRedirecting = false;
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && !isRedirecting) {
      try {
        const reqUrl = error?.config?.url || "";
        // Only auto-redirect for auth-protected routes, not public endpoints
        const isAdminRoute = reqUrl.includes("/admin") || reqUrl.includes("/dashboard");
        const isCustomerAuthRoute =
          reqUrl.includes("/orders") || reqUrl.includes("/account") || reqUrl.includes("/users");
        const currentPath = window.location.pathname;

        // Skip redirect if already on a login page
        if (currentPath.includes("/login")) {
          // no-op
        } else if (isAdminRoute) {
          isRedirecting = true;
          window.localStorage.removeItem("ramji-admin-token");
          window.localStorage.removeItem("ramji-admin-user");
          setAdminAuthToken("");
          window.location.href = "/admin/login";
        } else if (isCustomerAuthRoute) {
          isRedirecting = true;
          window.localStorage.removeItem("ramji-customer-session");
          window.location.href = "/login";
        }
      } catch (e) {
        // SSR guard
      }
    }

    console.error("API error:", error?.response?.status, error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
