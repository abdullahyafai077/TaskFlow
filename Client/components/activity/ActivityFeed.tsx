"use client";

import { formatRelativeTime, type AuditLog, type User } from "@/lib/types";

export function ActivityFeed({
  items,
  title = "Activity",
  emptyHint = "No activity yet",
}: {
  items: AuditLog[];
  title?: string;
  emptyHint?: string;
}) {
  return (
    <section className="tf-glass flex max-h-[70vh] flex-col rounded-[28px] p-5">
      <h2 className="mb-4 font-[family-name:var(--font-display)] text-lg font-bold">
        {title}
      </h2>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {items.map((log) => {
          const actor =
            typeof log.actorId === "object"
              ? (log.actorId as User).name
              : "Someone";
          return (
            <div
              key={log._id}
              className="rounded-2xl bg-surface-strong px-3 py-2.5 ring-1 ring-line"
            >
              <p className="text-sm text-ink">{log.message}</p>
              <p className="mt-1 font-mono text-[10px] text-muted">
                {actor} · {formatRelativeTime(log.createdAt)}
              </p>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">{emptyHint}</p>
        )}
      </div>
    </section>
  );
}
