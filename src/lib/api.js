// src/lib/api.js
import axios from "axios";

// No .env — hardcode for local dev
const API_BASE = "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // keep false unless you add cookies/sessions later
});

// (Optional) log errors globally
api.interceptors.response.use(
  (r) => r,
  (err) => {
    console.error("API error:", err?.response?.data || err.message);
    return Promise.reject(err);
  }
);
