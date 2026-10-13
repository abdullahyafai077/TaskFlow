"use client";

import { AnimatePresence } from "framer-motion";
import { CircleDot, LoaderCircle, CheckCircle2 } from "lucide-react";
import TaskCard from "./TaskCard";
import type { Task, TaskStatus } from "@/lib/types";

const meta: Record<
  TaskStatus,
  { label: string; className: string; Icon: typeof CircleDot }
> = {
  Todo: { label: "To Do", className: "tf-column-todo", Icon: CircleDot },
  "In Progress": {
    label: "In Progress",
    className: "tf-column-progress",
    Icon: LoaderCircle,
  },
  Done: { label: "Done", className: "tf-column-done", Icon: CheckCircle2 },
};

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onMove: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskColumn({
  status,
  tasks,
  onMove,
  onDelete,
}: TaskColumnProps) {
  const { label, className, Icon } = meta[status];

  return (
    <section
      className={`tf-glass ${className} flex min-h-[420px] flex-col rounded-[28px] p-4 sm:p-5`}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl"
            style={{ background: "var(--col-tint)", color: "var(--col-ink)" }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-ink">
              {label}
            </h2>
            <p className="text-xs text-muted">
              Click arrows to move across stages
            </p>
          </div>
        </div>
        <span
          className="rounded-xl px-2.5 py-1 font-mono text-xs font-medium"
          style={{ background: "var(--col-tint)", color: "var(--col-ink)" }}
        >
          {tasks.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onMove={onMove}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-line px-4 py-10 text-center">
            <p className="text-sm text-muted">No tasks here yet</p>
          </div>
        )}
      </div>
    </section>
  );
}
