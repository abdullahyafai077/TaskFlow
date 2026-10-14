export type Role = "Admin" | "Manager" | "Member";
export type TaskStatus = "Todo" | "In Progress" | "Done";
export type Priority = "Low" | "Medium" | "High" | "Urgent";

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceMember {
  userId: User | string;
  role: Role;
}

export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  ownerId: User | string;
  members: WorkspaceMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  _id: string;
  workspaceId: string;
  name: string;
  key: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subtask {
  _id?: string;
  title: string;
  done: boolean;
}

export interface Task {
  _id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  tags: string[];
  assigneeId?: User | string | null;
  subtasks: Subtask[];
  createdBy: User | string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  _id: string;
  workspaceId: string;
  actorId: User | string;
  action: string;
  entityType: string;
  entityId?: string;
  message: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export const STATUSES: TaskStatus[] = ["Todo", "In Progress", "Done"];
export const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];

export function getMemberRole(
  workspace: Workspace | null | undefined,
  userId?: string,
): Role | null {
  if (!workspace || !userId) return null;
  const member = workspace.members.find((m) => {
    const id = typeof m.userId === "string" ? m.userId : m.userId._id;
    return id === userId;
  });
  return member?.role ?? null;
}

export function formatRelativeTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
