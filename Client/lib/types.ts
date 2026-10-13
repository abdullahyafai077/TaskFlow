export type TaskStatus = "Todo" | "In Progress" | "Done";

export interface Task {
  _id: string;
  title: string;
  status: TaskStatus | string;
  createdAt?: string;
  updatedAt?: string;
}

export const STATUSES: TaskStatus[] = ["Todo", "In Progress", "Done"];

export function nextStatus(status: string): TaskStatus | null {
  if (status === "Todo") return "In Progress";
  if (status === "In Progress") return "Done";
  return null;
}

export function prevStatus(status: string): TaskStatus | null {
  if (status === "Done") return "In Progress";
  if (status === "In Progress") return "Todo";
  return null;
}

export function formatRelativeTime(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
