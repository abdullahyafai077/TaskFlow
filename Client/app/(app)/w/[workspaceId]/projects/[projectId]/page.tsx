"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { projectApi, workspaceApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { getMemberRole, type Project, type Task, type User } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { useBoardStore } from "@/stores/boardStore";
import { useState } from "react";

export default function ProjectBoardPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;
  const user = useAuthStore((s) => s.user);
  const workspaces = useAuthStore((s) => s.workspaces);

  const {
    loadTasks,
    loadActivity,
    upsertTask,
    removeTask,
    setTasks,
    prependActivity,
  } = useBoardStore();

  const [project, setProject] = useState<Project | null>(null);
  const [workspaceDetail, setWorkspaceDetail] = useState(
    workspaces.find((w) => w._id === workspaceId) || null,
  );

  const workspace =
    workspaceDetail || workspaces.find((w) => w._id === workspaceId) || null;

  const members = useMemo(() => {
    if (!workspace) return [] as User[];
    return workspace.members
      .map((m) => (typeof m.userId === "object" ? m.userId : null))
      .filter(Boolean) as User[];
  }, [workspace]);

  const role = getMemberRole(workspace, user?._id);
  const canDelete = role === "Admin" || role === "Manager";

  useEffect(() => {
    projectApi.list(workspaceId).then((res) => {
      setProject(res.data.find((p) => p._id === projectId) || null);
    });
    workspaceApi.get(workspaceId).then((res) => setWorkspaceDetail(res.data));
    void loadTasks(projectId);
    void loadActivity(workspaceId);
  }, [workspaceId, projectId, loadTasks, loadActivity]);

  useEffect(() => {
    const socket = getSocket();

    const onCreated = (task: Task) => {
      if (task.projectId === projectId) upsertTask(task);
    };
    const onUpdated = (task: Task) => {
      if (task.projectId === projectId) upsertTask(task);
    };
    const onDeleted = (payload: { _id: string; projectId?: string }) => {
      if (!payload.projectId || payload.projectId === projectId) {
        removeTask(payload._id);
      }
    };
    const onReordered = (payload: { projectId: string; tasks: Task[] }) => {
      if (payload.projectId === projectId) setTasks(payload.tasks);
    };
    const onActivity = (log: Parameters<typeof prependActivity>[0]) => {
      if (log.workspaceId === workspaceId) prependActivity(log);
    };

    socket.on("task:created", onCreated);
    socket.on("task:updated", onUpdated);
    socket.on("task:deleted", onDeleted);
    socket.on("task:reordered", onReordered);
    socket.on("activity:new", onActivity);

    return () => {
      socket.off("task:created", onCreated);
      socket.off("task:updated", onUpdated);
      socket.off("task:deleted", onDeleted);
      socket.off("task:reordered", onReordered);
      socket.off("activity:new", onActivity);
    };
  }, [
    projectId,
    workspaceId,
    upsertTask,
    removeTask,
    setTasks,
    prependActivity,
  ]);

  return (
    <KanbanBoard
      projectId={projectId}
      projectName={project?.name || "Project"}
      members={members}
      canDelete={canDelete}
    />
  );
}
