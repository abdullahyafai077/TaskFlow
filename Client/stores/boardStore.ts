"use client";

import { create } from "zustand";
import { activityApi, taskApi } from "@/lib/api";
import type { AuditLog, Task, TaskStatus } from "@/lib/types";

interface BoardState {
  tasks: Task[];
  activity: AuditLog[];
  loading: boolean;
  error: string | null;
  query: string;
  priorityFilter: string;
  assigneeFilter: string;
  setFilters: (f: {
    query?: string;
    priorityFilter?: string;
    assigneeFilter?: string;
  }) => void;
  loadTasks: (projectId: string) => Promise<void>;
  loadActivity: (workspaceId: string) => Promise<void>;
  setTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (id: string) => void;
  prependActivity: (log: AuditLog) => void;
  optimisticMove: (
    taskId: string,
    status: TaskStatus,
    order: number,
  ) => Task | null;
  commitReorder: (
    projectId: string,
    items: { id: string; status: TaskStatus; order: number }[],
  ) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  tasks: [],
  activity: [],
  loading: false,
  error: null,
  query: "",
  priorityFilter: "",
  assigneeFilter: "",

  setFilters: (f) => set(f),

  loadTasks: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await taskApi.list(projectId);
      set({ tasks: data });
    } catch {
      set({ error: "Failed to load tasks" });
    } finally {
      set({ loading: false });
    }
  },

  loadActivity: async (workspaceId) => {
    try {
      const { data } = await activityApi.list(workspaceId);
      set({ activity: data });
    } catch {
      /* non-blocking */
    }
  },

  setTasks: (tasks) => set({ tasks }),

  upsertTask: (task) =>
    set((state) => {
      const idx = state.tasks.findIndex((t) => t._id === task._id);
      if (idx === -1) return { tasks: [task, ...state.tasks] };
      const next = [...state.tasks];
      next[idx] = task;
      return { tasks: next };
    }),

  removeTask: (id) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t._id !== id) })),

  prependActivity: (log) =>
    set((state) => ({
      activity: [log, ...state.activity.filter((a) => a._id !== log._id)].slice(
        0,
        50,
      ),
    })),

  optimisticMove: (taskId, status, order) => {
    const prev = get().tasks.find((t) => t._id === taskId) || null;
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t._id === taskId ? { ...t, status, order } : t,
      ),
    }));
    return prev;
  },

  commitReorder: async (projectId, items) => {
    const { data } = await taskApi.reorder(projectId, items);
    set({ tasks: data });
  },
}));
