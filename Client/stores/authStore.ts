"use client";

import { create } from "zustand";
import { authApi, workspaceApi } from "@/lib/api";
import { clearToken, getToken, setToken } from "@/lib/auth";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { User, Workspace } from "@/lib/types";

interface AuthState {
  user: User | null;
  workspaces: Workspace[];
  loading: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  setWorkspaces: (workspaces: Workspace[]) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  workspaces: [],
  loading: false,
  hydrated: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.login({ email, password });
      setToken(data.token);
      connectSocket();
      set({ user: data.user });
      await get().refreshWorkspaces();
    } finally {
      set({ loading: false });
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.register({ name, email, password });
      setToken(data.token);
      connectSocket();
      set({ user: data.user });
      await get().refreshWorkspaces();
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    clearToken();
    disconnectSocket();
    set({ user: null, workspaces: [] });
  },

  hydrate: async () => {
    const token = getToken();
    if (!token) {
      set({ hydrated: true, user: null });
      return;
    }
    try {
      const { data } = await authApi.me();
      set({ user: data.user });
      connectSocket();
      await get().refreshWorkspaces();
    } catch {
      clearToken();
      set({ user: null, workspaces: [] });
    } finally {
      set({ hydrated: true });
    }
  },

  refreshWorkspaces: async () => {
    const { data } = await workspaceApi.list();
    set({ workspaces: data });
  },

  setWorkspaces: (workspaces) => set({ workspaces }),
}));
