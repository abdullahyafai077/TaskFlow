"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { joinWorkspaceRoom, leaveWorkspaceRoom } from "@/lib/socket";
import { Sidebar } from "./Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string | undefined;
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && !user) {
      router.replace("/login");
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!workspaceId || !user) return;
    joinWorkspaceRoom(workspaceId);
    return () => leaveWorkspaceRoom(workspaceId);
  }, [workspaceId, user]);

  if (!hydrated || !user) {
    return (
      <div className="tf-shell grid min-h-screen place-items-center text-muted">
        Loading TaskFlow…
      </div>
    );
  }

  return (
    <div className="tf-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-4 p-4">
        <Sidebar workspaceId={workspaceId} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
