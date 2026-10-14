"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { useBoardStore } from "@/stores/boardStore";
import {
  STATUSES,
  type Task,
  type TaskStatus,
  type User,
} from "@/lib/types";
import { Column } from "./Column";
import { Filters } from "./Filters";
import { TaskModal } from "./TaskModal";
import { TaskCard } from "./TaskCard";

function isStatus(id: string): id is TaskStatus {
  return STATUSES.includes(id as TaskStatus);
}

function applyReorder(
  tasks: Task[],
  items: { id: string; status: TaskStatus; order: number }[],
) {
  const map = new Map(items.map((i) => [i.id, i]));
  return tasks.map((t) => {
    const next = map.get(t._id);
    return next ? { ...t, status: next.status, order: next.order } : t;
  });
}

export function KanbanBoard({
  projectId,
  projectName,
  members,
  canDelete,
}: {
  projectId: string;
  projectName: string;
  members: User[];
  canDelete: boolean;
}) {
  const {
    tasks,
    activity,
    loading,
    error,
    query,
    priorityFilter,
    assigneeFilter,
    upsertTask,
    removeTask,
    commitReorder,
    setTasks,
  } = useBoardStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (query && !t.title.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (assigneeFilter) {
        const id =
          typeof t.assigneeId === "object" && t.assigneeId
            ? t.assigneeId._id
            : t.assigneeId;
        if (id !== assigneeFilter) return false;
      }
      return true;
    });
  }, [tasks, query, priorityFilter, assigneeFilter]);

  const byStatus = (status: TaskStatus) =>
    filtered
      .filter((t) => t.status === status)
      .sort((a, b) => a.order - b.order);

  const activeTask = tasks.find((t) => t._id === activeId) || null;

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    let nextStatus: TaskStatus = task.status;
    const overId = String(over.id);

    if (isStatus(overId)) {
      nextStatus = overId;
    } else {
      const overTask = tasks.find((t) => t._id === overId);
      if (overTask) nextStatus = overTask.status;
    }

    const columnTasks = tasks
      .filter((t) => t.status === nextStatus && t._id !== taskId)
      .sort((a, b) => a.order - b.order);

    let insertIndex = columnTasks.length;
    if (!isStatus(overId)) {
      const idx = columnTasks.findIndex((t) => t._id === overId);
      if (idx >= 0) insertIndex = idx;
    }

    const reordered = [...columnTasks];
    reordered.splice(insertIndex, 0, { ...task, status: nextStatus });

    const items = STATUSES.flatMap((status) => {
      const list =
        status === nextStatus
          ? reordered
          : tasks
              .filter((t) => t.status === status && t._id !== taskId)
              .sort((a, b) => a.order - b.order);
      return list.map((t, order) => ({
        id: t._id,
        status,
        order,
      }));
    });

    const snapshot = tasks;
    setTasks(applyReorder(tasks, items));

    try {
      await commitReorder(projectId, items);
    } catch {
      setTasks(snapshot);
    }
  };

  return (
    <div className="space-y-4">
      <header className="tf-glass rounded-[28px] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              Project board
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold text-ink">
              {projectName}
            </h1>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            New task
          </Button>
        </div>
        <div className="mt-4">
          <Filters members={members} />
        </div>
        {error && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        {loading ? (
          <div className="tf-glass grid place-items-center rounded-[28px] py-24 text-muted">
            Loading board…
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {STATUSES.map((status) => (
                <Column
                  key={status}
                  status={status}
                  tasks={byStatus(status)}
                  onOpen={(task) => {
                    setEditing(task);
                    setModalOpen(true);
                  }}
                />
              ))}
            </div>
            <DragOverlay>
              {activeTask ? (
                <div className="w-[280px] opacity-90">
                  <TaskCard task={activeTask} onOpen={() => undefined} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}

        <ActivityFeed items={activity} title="Live activity" />
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        members={members}
        task={editing}
        canDelete={canDelete}
        onSaved={upsertTask}
        onDeleted={removeTask}
      />
    </div>
  );
}
