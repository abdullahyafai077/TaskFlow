"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import {
  formatRelativeTime,
  nextStatus,
  prevStatus,
  type Task,
} from "@/lib/types";

interface TaskCardProps {
  task: Task;
  onMove: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onMove, onDelete }: TaskCardProps) {
  const forward = nextStatus(task.status);
  const back = prevStatus(task.status);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, y: -6 }}
      transition={{ duration: 0.22 }}
      className="group rounded-2xl bg-surface-strong p-4 shadow-[0_10px_30px_-18px_rgba(15,23,32,0.45)] ring-1 ring-line"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] font-medium leading-snug text-ink">
          {task.title}
        </p>
        <button
          type="button"
          onClick={() => onDelete(task._id)}
          aria-label="Delete task"
          className="rounded-lg p-1.5 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] tracking-wide text-muted">
          {formatRelativeTime(task.createdAt)}
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={!back}
            onClick={() => back && onMove(task._id, back)}
            aria-label="Move back"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-background text-ink ring-1 ring-line transition enabled:hover:bg-ink enabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={!forward}
            onClick={() => forward && onMove(task._id, forward)}
            aria-label="Move forward"
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-white transition enabled:hover:bg-accent disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
