import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
}

export interface TestRun {
  id: string;
  name: string;
  description: string | null;
  status: "pending" | "running" | "passed" | "failed";
  result_summary: string | null;
}

export interface EncryptedRecord {
  id: string;
  label: string;
  created_at: string;
}
