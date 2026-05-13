"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MkeLogo } from "@/components/brand/mke-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { isLocalOnlyMode } from "@/lib/env";

export function AdminLoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const error = params.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const banner = useMemo(() => {
    if (error === "forbidden") {
      return "This account is not authorized for the admin console.";
    }
    return null;
  }, [error]);

  const localOnly = isLocalOnlyMode() || !process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(circle_at_30%_-10%,rgba(249,115,22,0.35),transparent_45%),#020202] px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(120deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-8 rounded-[32px] border border-white/10 bg-black/55 p-8 shadow-[0_0_80px_rgba(249,115,22,0.15)] backdrop-blur-2xl">
        <MkeLogo />
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold uppercase">
            Admin access
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Secure console for prize math, inventory, and redemption reconciliation.
          </p>
        </div>
        {banner && (
          <div className="rounded-2xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            {banner}
          </div>
        )}
        {localOnly && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
            Supabase is not configured or local-only mode is on. Wire{" "}
            <span className="font-mono">.env.local</span> to enable authentication.
          </div>
        )}
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (localOnly) {
              toast.error("Auth unavailable in local-only mode.");
              return;
            }
            setBusy(true);
            const supa = createClient();
            const { error: err } = await supa.auth.signInWithPassword({ email, password });
            setBusy(false);
            if (err) {
              toast.error(err.message);
              return;
            }
            router.replace(next);
            router.refresh();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              className="h-12 rounded-xl border-white/10 bg-black/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              className="h-12 rounded-xl border-white/10 bg-black/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            disabled={busy || localOnly}
            className="h-12 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-base font-semibold text-black hover:brightness-110"
          >
            {busy ? "Signing in…" : "Enter console"}
          </Button>
        </form>
        <p className="text-center text-xs text-zinc-500">
          Floor staff?{" "}
          <Link href="/" className="text-orange-300 underline-offset-4 hover:underline">
            Return to Prize Hub
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
