import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1"
).replace(/\/$/, "");

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getErrorMessage = (
  error,
  fallback = "Something went wrong. Please try again."
) => {
  const data = error?.response?.data;
  if (Array.isArray(data?.details) && data.details.length > 0) {
    return data.details[0];
  }
  return data?.message || error?.message || fallback;
};

export const multipartConfig = {
  headers: { "Content-Type": "multipart/form-data" },
};

export const resumeDownloadUrl = (applicationId) =>
  `${API_ORIGIN}/api/v1/application/${applicationId}/resume`;

export default api;
