"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FolderKanban } from "lucide-react";
import { activityApi, projectApi, workspaceApi } from "@/lib/api";
import type { AuditLog, Project, Workspace } from "@/lib/types";
import { formatRelativeTime } from "@/lib/types";
import { ActivityFeed } from "@/components/activity/ActivityFeed";

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);

  useEffect(() => {
    workspaceApi.get(workspaceId).then((r) => setWorkspace(r.data));
    projectApi.list(workspaceId).then((r) => setProjects(r.data));
    activityApi.list(workspaceId).then((r) => setActivity(r.data));
  }, [workspaceId]);

  return (
    <div className="space-y-4">
      <header className="tf-glass rounded-[28px] p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Workspace
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold text-ink">
          {workspace?.name || "Loading…"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {workspace?.members.length || 0} members · {projects.length} projects
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="tf-glass rounded-[28px] p-5">
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-bold">
            Projects
          </h2>
          <div className="space-y-2">
            {projects.map((p) => (
              <Link
                key={p._id}
                href={`/w/${workspaceId}/projects/${p._id}`}
                className="flex items-center gap-3 rounded-2xl bg-surface-strong px-4 py-3 ring-1 ring-line transition hover:ring-accent"
              >
                <FolderKanban className="h-4 w-4 text-accent" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="truncate text-xs text-muted">
                    {p.description || "No description"}
                  </p>
                </div>
                <span className="font-mono text-xs text-muted">{p.key}</span>
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="py-8 text-center text-sm text-muted">
                No projects yet. Create one from the sidebar.
              </p>
            )}
          </div>
        </section>

        <ActivityFeed
          items={activity}
          title="Recent activity"
          emptyHint="Actions in this workspace will appear here."
        />
      </div>

      {activity[0] && (
        <p className="text-center font-mono text-[11px] text-muted">
          Last event {formatRelativeTime(activity[0].createdAt)}
        </p>
      )}
    </div>
  );
}
