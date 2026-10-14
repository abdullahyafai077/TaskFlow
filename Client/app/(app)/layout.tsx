import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";

function AppLoading() {
  return (
    <div className="tf-shell grid min-h-screen place-items-center text-muted">
      Loading TaskFlow…
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AppLoading />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
