"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CheckCircle2, CircleDot, LoaderCircle } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { TaskCard } from "./TaskCard";

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

export function Column({
  status,
  tasks,
  onOpen,
}: {
  status: TaskStatus;
  tasks: Task[];
  onOpen: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { label, className, Icon } = meta[status];

  return (
    <section
      className={`tf-glass ${className} flex min-h-[520px] flex-col rounded-[28px] p-4 ${
        isOver ? "ring-2 ring-accent" : ""
      }`}
    >
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl"
            style={{ background: "var(--col-tint)", color: "var(--col-ink)" }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
              {label}
            </h2>
            <p className="text-xs text-muted">Drag cards to update status</p>
          </div>
        </div>
        <span
          className="rounded-xl px-2.5 py-1 font-mono text-xs font-medium"
          style={{ background: "var(--col-tint)", color: "var(--col-ink)" }}
        >
          {tasks.length}
        </span>
      </header>

      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2">
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} onOpen={onOpen} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-line text-sm text-muted">
            Drop tasks here
          </div>
        )}
      </div>
    </section>
  );
}
