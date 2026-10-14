"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading, user, hydrated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (hydrated && user) router.replace("/");
  }, [hydrated, user, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Login failed",
      );
    }
  };

  return (
    <div className="tf-shell grid min-h-screen place-items-center px-4">
      <div className="tf-glass w-full max-w-md rounded-[32px] p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          Welcome back
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold text-ink">
          TaskFlow
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to your workspaces and live boards.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          No account?{" "}
          <Link href="/register" className="font-medium text-accent">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
