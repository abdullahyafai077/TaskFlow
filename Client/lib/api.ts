import axios from "axios";
import { getToken, clearToken } from "./auth";
import type {
  AuditLog,
  Priority,
  Project,
  Role,
  Task,
  TaskStatus,
  User,
  Workspace,
} from "./types";

const PROD_API = "https://taskflow-wwrr.onrender.com/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production" ? PROD_API : "http://localhost:5000/api");

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      clearToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ token: string; user: User }>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>("/auth/login", data),
  me: () => api.get<{ user: User }>("/auth/me"),
};

export const workspaceApi = {
  list: () => api.get<Workspace[]>("/workspaces"),
  create: (data: { name: string }) => api.post<Workspace>("/workspaces", data),
  get: (id: string) => api.get<Workspace>(`/workspaces/${id}`),
  update: (id: string, data: { name?: string }) =>
    api.patch<Workspace>(`/workspaces/${id}`, data),
  addMember: (id: string, data: { email: string; role?: Role }) =>
    api.post<Workspace>(`/workspaces/${id}/members`, data),
};

export const projectApi = {
  list: (workspaceId: string) =>
    api.get<Project[]>(`/workspaces/${workspaceId}/projects`),
  create: (
    workspaceId: string,
    data: { name: string; key: string; description?: string },
  ) => api.post<Project>(`/workspaces/${workspaceId}/projects`, data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch<Project>(`/projects/${id}`, data),
  remove: (id: string) => api.delete(`/projects/${id}`),
};

export const taskApi = {
  list: (
    projectId: string,
    params?: {
      status?: TaskStatus;
      priority?: Priority;
      assignee?: string;
      q?: string;
    },
  ) => api.get<Task[]>(`/projects/${projectId}/tasks`, { params }),
  create: (
    projectId: string,
    data: Partial<Task> & { title: string },
  ) => api.post<Task>(`/projects/${projectId}/tasks`, data),
  update: (id: string, data: Partial<Task>) =>
    api.patch<Task>(`/tasks/${id}`, data),
  remove: (id: string) => api.delete(`/tasks/${id}`),
  reorder: (
    projectId: string,
    items: { id: string; status: TaskStatus; order: number }[],
  ) => api.post<Task[]>(`/projects/${projectId}/tasks/reorder`, { items }),
};

export const activityApi = {
  list: (workspaceId: string, limit = 40) =>
    api.get<AuditLog[]>(`/workspaces/${workspaceId}/activity`, {
      params: { limit },
    }),
};
