"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Plus,
  Radio,
  Search,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  createTask,
  deleteTask,
  getTasks,
  updateTaskStatus,
} from "@/services/api";
import { socket } from "@/services/socket";
import TaskColumn from "@/components/TaskColumn";
import { STATUSES, type Task } from "@/lib/types";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    let alive = true;

    getTasks()
      .then((res) => {
        if (alive) setTasks(res.data);
      })
      .catch(() => {
        if (alive) setError("Could not load tasks. Is the API running on :5000?");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    socket.on("task_created", (newTask: Task) => {
      setTasks((prev) =>
        prev.some((t) => t._id === newTask._id) ? prev : [newTask, ...prev],
      );
    });

    socket.on("task_updated", (updatedTask: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)),
      );
    });

    socket.on("task_deleted", (id: string) => {
      setTasks((prev) => prev.filter((t) => t._id !== id));
    });

    return () => {
      alive = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("task_created");
      socket.off("task_updated");
      socket.off("task_deleted");
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, query]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "Todo").length,
      progress: tasks.filter((t) => t.status === "In Progress").length,
      done: tasks.filter((t) => t.status === "Done").length,
    }),
    [tasks],
  );

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await createTask({ title: title.trim(), status: "Todo" });
      setTitle("");
    } catch {
      setError("Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMove = async (id: string, status: string) => {
    try {
      await updateTaskStatus(id, status);
    } catch {
      setError("Failed to update task.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTask(id);
    } catch {
      setError("Failed to delete task.");
    }
  };

  return (
    <div className="tf-shell">
      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
                Full-stack · Real-time
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                TaskFlow
              </h1>
              <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
                A live Kanban board — create tasks, move them through stages,
                and sync instantly across clients with Socket.io.
              </p>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm ring-1 ring-line ${
                connected
                  ? "bg-accent-soft text-accent"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {connected ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
              <span className="font-medium">
                {connected ? "Live sync on" : "Offline"}
              </span>
              <Radio className="h-3.5 w-3.5 opacity-70" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total", value: counts.total, icon: Activity },
              { label: "To Do", value: counts.todo },
              { label: "In Progress", value: counts.progress },
              { label: "Done", value: counts.done },
            ].map((stat) => (
              <div
                key={stat.label}
                className="tf-glass rounded-2xl px-4 py-3"
              >
                <p className="text-xs uppercase tracking-wider text-muted">
                  {stat.label}
                </p>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-ink">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="tf-glass mb-6 rounded-[28px] p-4 sm:p-5"
        >
          <form
            onSubmit={handleAdd}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <label className="relative flex-1">
              <span className="sr-only">New task</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to get done?"
                className="h-12 w-full rounded-2xl border-0 bg-surface-strong px-4 text-ink outline-none ring-1 ring-line transition placeholder:text-muted focus:ring-2 focus:ring-accent"
              />
            </label>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-ink px-5 font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add task
            </button>
          </form>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="h-11 w-full rounded-2xl bg-background/70 pl-10 pr-4 text-sm text-ink outline-none ring-1 ring-line transition placeholder:text-muted focus:ring-2 focus:ring-progress"
            />
          </div>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">
              {error}
            </p>
          )}
        </motion.section>

        {loading ? (
          <div className="tf-glass grid place-items-center rounded-[28px] py-24 text-muted">
            Loading board…
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
          >
            {STATUSES.map((status) => (
              <TaskColumn
                key={status}
                status={status}
                tasks={filtered.filter((t) => t.status === status)}
                onMove={handleMove}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        )}

        <p className="mt-8 text-center font-mono text-[11px] tracking-wide text-muted">
          Next.js · Express · MongoDB · Socket.io
        </p>
      </main>
    </div>
  );
}
