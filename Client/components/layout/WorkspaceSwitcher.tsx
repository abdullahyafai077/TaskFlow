"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, Plus } from "lucide-react";
import type { Workspace } from "@/lib/types";

export function WorkspaceSwitcher({
  workspaces,
  currentId,
  onCreate,
}: {
  workspaces: Workspace[];
  currentId?: string;
  onCreate: () => void;
}) {
  const router = useRouter();
  const current = workspaces.find((w) => w._id === currentId);

  return (
    <div className="rounded-2xl bg-background/70 p-2 ring-1 ring-line">
      <label className="mb-1 block px-2 text-[10px] font-medium uppercase tracking-wider text-muted">
        Workspace
      </label>
      <div className="relative">
        <select
          className="h-10 w-full appearance-none rounded-xl bg-surface-strong px-3 pr-8 text-sm font-medium text-ink outline-none"
          value={currentId || ""}
          onChange={(e) => {
            if (e.target.value) router.push(`/w/${e.target.value}`);
          }}
        >
          {!currentId && <option value="">Select workspace</option>}
          {workspaces.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
      {current && (
        <p className="mt-1 truncate px-2 font-mono text-[10px] text-muted">
          /{current.slug}
        </p>
      )}
      <button
        type="button"
        onClick={onCreate}
        className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-xs text-muted transition hover:bg-surface-strong hover:text-ink"
      >
        <Plus className="h-3.5 w-3.5" />
        New workspace
      </button>
    </div>
  );
}
