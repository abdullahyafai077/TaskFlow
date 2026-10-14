"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { workspaceApi } from "@/lib/api";
import { getMemberRole, type Role, type User, type Workspace } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const { user, refreshWorkspaces } = useAuthStore();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Member");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const memberRole = getMemberRole(workspace, user?._id);

  useEffect(() => {
    workspaceApi.get(workspaceId).then((res) => {
      setWorkspace(res.data);
      setName(res.data.name);
      const r = getMemberRole(res.data, user?._id);
      if (r !== "Admin" && r !== "Manager") {
        router.replace(`/w/${workspaceId}`);
      }
    });
  }, [workspaceId, user?._id, router]);

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    if (memberRole !== "Admin") {
      setError("Only Admins can rename the workspace");
      return;
    }
    setError("");
    try {
      const { data } = await workspaceApi.update(workspaceId, { name });
      setWorkspace(data);
      await refreshWorkspaces();
      setMessage("Workspace updated");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Update failed",
      );
    }
  };

  const addMember = async (e: FormEvent) => {
    e.preventDefault();
    if (memberRole !== "Admin") {
      setError("Only Admins can add members");
      return;
    }
    setError("");
    try {
      const { data } = await workspaceApi.addMember(workspaceId, {
        email,
        role,
      });
      setWorkspace(data);
      await refreshWorkspaces();
      setEmail("");
      setMessage("Member added");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to add member",
      );
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="tf-glass rounded-[28px] p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Settings
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-extrabold">
          Workspace settings
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your role: <strong>{memberRole || "…"}</strong>
        </p>
      </header>

      <section className="tf-glass rounded-[28px] p-5">
        <h2 className="mb-3 font-bold">General</h2>
        <form onSubmit={saveName} className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Button type="submit" disabled={memberRole !== "Admin"}>
            Save
          </Button>
        </form>
      </section>

      <section className="tf-glass rounded-[28px] p-5">
        <h2 className="mb-3 font-bold">Members</h2>
        <ul className="mb-4 space-y-2">
          {workspace?.members.map((m) => {
            const u = typeof m.userId === "object" ? (m.userId as User) : null;
            return (
              <li
                key={u?._id || String(m.userId)}
                className="flex items-center justify-between rounded-2xl bg-surface-strong px-3 py-2 text-sm ring-1 ring-line"
              >
                <span>
                  {u?.name || "User"}{" "}
                  <span className="text-muted">({u?.email})</span>
                </span>
                <span className="font-mono text-xs text-muted">{m.role}</span>
              </li>
            );
          })}
        </ul>

        <form onSubmit={addMember} className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
          <Input
            type="email"
            placeholder="Member email (must be registered)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={memberRole !== "Admin"}
          />
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            disabled={memberRole !== "Admin"}
          >
            <option value="Member">Member</option>
            <option value="Manager">Manager</option>
            <option value="Admin">Admin</option>
          </Select>
          <Button type="submit" disabled={memberRole !== "Admin" || !email}>
            Add
          </Button>
        </form>
      </section>

      {message && (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
