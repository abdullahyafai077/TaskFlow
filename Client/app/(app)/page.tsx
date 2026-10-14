"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { workspaceApi } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const { workspaces, refreshWorkspaces } = useAuthStore();

  useEffect(() => {
    if (workspaces.length > 0) {
      router.replace(`/w/${workspaces[0]._id}`);
    }
  }, [workspaces, router]);

  const createFirst = async () => {
    const { data } = await workspaceApi.create({ name: "My Workspace" });
    await refreshWorkspaces();
    router.push(`/w/${data._id}`);
  };

  return (
    <div className="tf-glass flex h-full min-h-[70vh] flex-col items-center justify-center rounded-[32px] p-8 text-center">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-ink">
        Create your first workspace
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        Workspaces isolate teams and projects. You&apos;ll be Admin of anything
        you create.
      </p>
      <Button className="mt-6" onClick={createFirst}>
        Create workspace
      </Button>
    </div>
  );
}
