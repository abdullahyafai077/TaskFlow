"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import {
  formatRelativeTime,
  type Priority,
  type Task,
  type User,
} from "@/lib/types";
import { cn } from "@/lib/cn";

const priorityStyle: Record<Priority, string> = {
  Low: "bg-done-soft text-done",
  Medium: "bg-progress-soft text-progress",
  High: "bg-accent-soft text-accent",
  Urgent: "bg-red-50 text-red-700",
};

export function TaskCard({
  task,
  onOpen,
}: {
  task: Task;
  onOpen: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id, data: { status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignee =
    task.assigneeId && typeof task.assigneeId === "object"
      ? (task.assigneeId as User).name
      : null;

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-2xl bg-surface-strong p-3 shadow-[0_10px_30px_-18px_rgba(15,23,32,0.45)] ring-1 ring-line",
        isDragging && "z-20 opacity-90 ring-2 ring-accent",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none rounded-lg p-1 text-muted opacity-60 hover:bg-background hover:opacity-100 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag task"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onOpen(task)}
        >
          <p className="text-sm font-medium leading-snug text-ink">
            {task.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge className={priorityStyle[task.priority]}>
              {task.priority}
            </Badge>
            {task.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} className="bg-background text-muted">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="truncate text-[11px] text-muted">
              {assignee || "Unassigned"}
            </span>
            <span className="font-mono text-[10px] text-muted">
              {formatRelativeTime(task.createdAt)}
            </span>
          </div>
        </button>
      </div>
    </article>
  );
}
