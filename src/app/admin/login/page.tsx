import { Suspense } from "react";
import { AdminLoginClient } from "./login-client";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-black text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <AdminLoginClient />
    </Suspense>
  );
}
