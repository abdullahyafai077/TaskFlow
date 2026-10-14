"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Plus,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { projectApi, workspaceApi } from "@/lib/api";
import { cn } from "@/lib/cn";
import { getMemberRole, type Project } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

export function Sidebar({ workspaceId }: { workspaceId?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, workspaces, logout, refreshWorkspaces, setWorkspaces } =
    useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [wsName, setWsName] = useState("");
  const [projName, setProjName] = useState("");
  const [projKey, setProjKey] = useState("");
  const [error, setError] = useState("");

  const workspace = workspaces.find((w) => w._id === workspaceId);
  const role = getMemberRole(workspace, user?._id);

  useEffect(() => {
    if (!workspaceId) return;
    projectApi
      .list(workspaceId)
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]));
  }, [workspaceId, pathname]);

  const createWorkspace = async () => {
    setError("");
    try {
      const { data } = await workspaceApi.create({ name: wsName });
      await refreshWorkspaces();
      setCreateOpen(false);
      setWsName("");
      router.push(`/w/${data._id}`);
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to create workspace",
      );
    }
  };

  const createProject = async () => {
    if (!workspaceId) return;
    setError("");
    try {
      const { data } = await projectApi.create(workspaceId, {
        name: projName,
        key: projKey || projName.slice(0, 3).toUpperCase(),
      });
      setProjects((prev) => [data, ...prev]);
      setProjectOpen(false);
      setProjName("");
      setProjKey("");
      router.push(`/w/${workspaceId}/projects/${data._id}`);
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to create project",
      );
    }
  };

  return (
    <aside className="tf-glass flex h-full w-[280px] shrink-0 flex-col rounded-[28px] p-4">
      <div className="mb-5 px-1">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight text-ink"
        >
          TaskFlow
        </Link>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Enterprise board
        </p>
      </div>

      <WorkspaceSwitcher
        workspaces={workspaces}
        currentId={workspaceId}
        onCreate={() => setCreateOpen(true)}
      />

      {workspaceId && (
        <nav className="mt-5 flex flex-1 flex-col gap-1 overflow-y-auto">
          <Link
            href={`/w/${workspaceId}`}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition",
              pathname === `/w/${workspaceId}`
                ? "bg-ink text-white"
                : "text-muted hover:bg-background hover:text-ink",
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Link>

          <div className="mt-4 mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Projects
            </span>
            {(role === "Admin" || role === "Manager") && (
              <button
                type="button"
                onClick={() => setProjectOpen(true)}
                className="rounded-lg p-1 text-muted hover:bg-background hover:text-ink"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {projects.map((p) => (
            <Link
              key={p._id}
              href={`/w/${workspaceId}/projects/${p._id}`}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition",
                pathname.includes(p._id)
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-background hover:text-ink",
              )}
            >
              <FolderKanban className="h-4 w-4" />
              <span className="truncate">{p.name}</span>
              <span className="ml-auto font-mono text-[10px] opacity-70">
                {p.key}
              </span>
            </Link>
          ))}

          {(role === "Admin" || role === "Manager") && (
            <Link
              href={`/w/${workspaceId}/settings`}
              className={cn(
                "mt-4 flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition",
                pathname.endsWith("/settings")
                  ? "bg-ink text-white"
                  : "text-muted hover:bg-background hover:text-ink",
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          )}
        </nav>
      )}

      <div className="mt-auto border-t border-line pt-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
          <p className="truncate text-xs text-muted">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            logout();
            setWorkspaces([]);
            router.push("/login");
          }}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New workspace"
      >
        <div className="space-y-3">
          <Input
            placeholder="Workspace name"
            value={wsName}
            onChange={(e) => setWsName(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            className="w-full"
            disabled={!wsName.trim()}
            onClick={createWorkspace}
          >
            Create workspace
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={projectOpen}
        onClose={() => setProjectOpen(false)}
        title="New project"
      >
        <div className="space-y-3">
          <Input
            placeholder="Project name"
            value={projName}
            onChange={(e) => setProjName(e.target.value)}
          />
          <Input
            placeholder="Key (e.g. TF)"
            value={projKey}
            maxLength={6}
            onChange={(e) => setProjKey(e.target.value.toUpperCase())}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            className="w-full"
            disabled={!projName.trim()}
            onClick={createProject}
          >
            Create project
          </Button>
        </div>
      </Dialog>
    </aside>
  );
}
